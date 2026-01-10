/**
 * Prescription Refill Automation Service
 * 
 * Handles automatic detection of prescriptions needing refills and
 * manages the refill request process for eligible prescriptions.
 */

import connectDB from '@/lib/db/mongodb';
import Prescription, { IPrescription, IRefillHistory } from '@/lib/db/models/Prescription';
import { pharmacyIntegrationService } from './pharmacy-api-integration';
import { NotificationService } from './notification-service';

const notificationService = new NotificationService();

export interface RefillEligibilityResult {
  eligible: boolean;
  reason?: string;
  canAutoRefill: boolean;
  daysUntilDue?: number;
}

export interface RefillRequestResult {
  success: boolean;
  refillId?: string;
  message: string;
  estimatedReadyDate?: Date;
  pharmacyConfirmationNumber?: string;
  error?: string;
}

export class PrescriptionRefillAutomationService {
  /**
   * Check all active prescriptions for a user and identify those needing refills
   */
  async checkRefillNeeds(userId: string): Promise<IPrescription[]> {
    try {
      await connectDB();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find all active prescriptions with auto-refill enabled
      const prescriptions = await Prescription.find({
        userId,
        isActive: true,
        autoRefillEnabled: true,
        refillsRemaining: { $gt: 0 }
      });

      const needsRefill: IPrescription[] = [];

      for (const prescription of prescriptions) {
        const eligibility = this.canAutoRefill(prescription);
        
        if (eligibility.eligible && eligibility.canAutoRefill) {
          // Check if refill is due within the auto-refill window
          if (prescription.nextRefillDueDate) {
            const daysUntilDue = this.calculateDaysUntilDue(prescription.nextRefillDueDate);
            
            if (daysUntilDue <= prescription.autoRefillDaysBefore) {
              needsRefill.push(prescription);
            }
          } else {
            // If nextRefillDueDate is not set, calculate it
            const nextDueDate = this.calculateNextRefillDate(prescription);
            if (nextDueDate) {
              const daysUntilDue = this.calculateDaysUntilDue(nextDueDate);
              if (daysUntilDue <= prescription.autoRefillDaysBefore) {
                needsRefill.push(prescription);
              }
            }
          }
        }
      }

      return needsRefill;
    } catch (error) {
      console.error('Error checking refill needs:', error);
      throw error;
    }
  }

  /**
   * Determine if a prescription is eligible for auto-refill
   */
  canAutoRefill(prescription: IPrescription): RefillEligibilityResult {
    // Check if auto-refill is enabled
    if (!prescription.autoRefillEnabled) {
      return {
        eligible: false,
        canAutoRefill: false,
        reason: 'Auto-refill is not enabled for this prescription'
      };
    }

    // Check if prescription is active
    if (!prescription.isActive) {
      return {
        eligible: false,
        canAutoRefill: false,
        reason: 'Prescription is not active'
      };
    }

    // Check if refills are remaining
    if (prescription.refillsRemaining <= 0) {
      return {
        eligible: false,
        canAutoRefill: false,
        reason: 'No refills remaining - requires new prescription from doctor'
      };
    }

    // Check if physician approval is required
    if (prescription.requiresPhysicianApproval) {
      return {
        eligible: true,
        canAutoRefill: false,
        reason: 'This prescription requires physician approval for refills'
      };
    }

    // Check if it's a maintenance medication (typically eligible for auto-refill)
    if (!prescription.isMaintenanceMedication) {
      return {
        eligible: true,
        canAutoRefill: false,
        reason: 'This medication may require doctor review before refill'
      };
    }

    // Calculate days until due
    let daysUntilDue: number | undefined;
    if (prescription.nextRefillDueDate) {
      daysUntilDue = this.calculateDaysUntilDue(prescription.nextRefillDueDate);
    } else {
      const nextDueDate = this.calculateNextRefillDate(prescription);
      if (nextDueDate) {
        daysUntilDue = this.calculateDaysUntilDue(nextDueDate);
      }
    }

    return {
      eligible: true,
      canAutoRefill: true,
      daysUntilDue
    };
  }

  /**
   * Calculate the next refill due date based on prescription details
   */
  calculateNextRefillDate(prescription: IPrescription): Date | null {
    try {
      // Use daysSupply if available, otherwise calculate from frequency
      let daysBetweenRefills = prescription.daysSupply || 30; // Default 30 days

      // If we have a last refill date, calculate from there
      if (prescription.lastRefillDate) {
        const nextDate = new Date(prescription.lastRefillDate);
        nextDate.setDate(nextDate.getDate() + daysBetweenRefills);
        return nextDate;
      }

      // Otherwise, calculate from start date
      if (prescription.startDate) {
        const startDate = new Date(prescription.startDate);
        const nextDate = new Date(startDate);
        nextDate.setDate(nextDate.getDate() + daysBetweenRefills);
        return nextDate;
      }

      return null;
    } catch (error) {
      console.error('Error calculating next refill date:', error);
      return null;
    }
  }

  /**
   * Calculate days until refill is due
   */
  calculateDaysUntilDue(nextRefillDueDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(nextRefillDueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  /**
   * Request a refill for a prescription
   */
  async requestRefill(
    prescriptionId: string,
    userId: string,
    manualRequest: boolean = false
  ): Promise<RefillRequestResult> {
    try {
      await connectDB();

      // Find the prescription
      const prescription = await Prescription.findOne({
        _id: prescriptionId,
        userId
      });

      if (!prescription) {
        return {
          success: false,
          message: 'Prescription not found',
          error: 'PRESCRIPTION_NOT_FOUND'
        };
      }

      // Check eligibility (unless manual request)
      if (!manualRequest) {
        const eligibility = this.canAutoRefill(prescription);
        if (!eligibility.canAutoRefill) {
          return {
            success: false,
            message: eligibility.reason || 'Prescription is not eligible for auto-refill',
            error: 'NOT_ELIGIBLE'
          };
        }
      } else {
        // For manual requests, check basic requirements
        if (!prescription.isActive) {
          return {
            success: false,
            message: 'Prescription is not active',
            error: 'PRESCRIPTION_INACTIVE'
          };
        }
        if (prescription.refillsRemaining <= 0) {
          return {
            success: false,
            message: 'No refills remaining - requires new prescription from doctor',
            error: 'NO_REFILLS_REMAINING'
          };
        }
      }

      // Request refill from pharmacy
      const pharmacyResult = await pharmacyIntegrationService.requestRefill(
        prescription.pharmacy,
        prescription.pharmacyRxNumber || prescription._id.toString(),
        userId,
        {
          medicationName: prescription.medicationName,
          dosage: prescription.dosage,
          quantity: prescription.quantity
        }
      );

      // Create refill history entry
      const refillHistoryEntry: IRefillHistory = {
        date: new Date(),
        status: pharmacyResult.success ? 'requested' : 'failed',
        pharmacy: prescription.pharmacy,
        estimatedReady: pharmacyResult.estimatedReadyDate,
        pharmacyConfirmationNumber: pharmacyResult.confirmationNumber,
        failureReason: pharmacyResult.success ? undefined : pharmacyResult.error
      };

      // Update prescription
      prescription.refillHistory.push(refillHistoryEntry);
      
      if (pharmacyResult.success) {
        // Update refill tracking
        prescription.lastRefillDate = new Date();
        prescription.refillsRemaining = Math.max(0, prescription.refillsRemaining - 1);
        
        // Calculate next refill due date
        const nextDueDate = this.calculateNextRefillDate(prescription);
        if (nextDueDate) {
          prescription.nextRefillDueDate = nextDueDate;
        }
      }

      await prescription.save();

      // Send notification
      try {
        if (pharmacyResult.success) {
          await notificationService.sendNotification(userId, {
            type: 'prescription_refill_requested',
            title: 'Prescription Refill Requested',
            message: `Your refill for ${prescription.medicationName} has been requested at ${prescription.pharmacy}.`,
            data: {
              prescriptionId: prescription._id.toString(),
              medicationName: prescription.medicationName,
              pharmacy: prescription.pharmacy,
              estimatedReady: pharmacyResult.estimatedReadyDate,
              confirmationNumber: pharmacyResult.confirmationNumber
            }
          });
        } else {
          await notificationService.sendNotification(userId, {
            type: 'prescription_refill_failed',
            title: 'Prescription Refill Failed',
            message: `Failed to request refill for ${prescription.medicationName}: ${pharmacyResult.error}`,
            data: {
              prescriptionId: prescription._id.toString(),
              medicationName: prescription.medicationName,
              error: pharmacyResult.error
            }
          });
        }
      } catch (notificationError) {
        // Log but don't fail the refill request if notification fails
        console.error('Error sending notification:', notificationError);
      }

      return {
        success: pharmacyResult.success,
        refillId: refillHistoryEntry.date.toISOString(),
        message: pharmacyResult.success 
          ? 'Refill requested successfully' 
          : `Failed to request refill: ${pharmacyResult.error}`,
        estimatedReadyDate: pharmacyResult.estimatedReadyDate,
        pharmacyConfirmationNumber: pharmacyResult.confirmationNumber,
        error: pharmacyResult.success ? undefined : pharmacyResult.error
      };
    } catch (error: any) {
      console.error('Error requesting refill:', error);
      return {
        success: false,
        message: 'An error occurred while requesting the refill',
        error: error.message || 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Update refill status (called when pharmacy notifies of status change)
   */
  async updateRefillStatus(
    prescriptionId: string,
    userId: string,
    refillDate: Date,
    status: IRefillHistory['status'],
    additionalInfo?: {
      estimatedReady?: Date;
      actualReady?: Date;
      pickedUp?: Date;
      notes?: string;
      confirmationNumber?: string;
    }
  ): Promise<boolean> {
    try {
      await connectDB();

      const prescription = await Prescription.findOne({
        _id: prescriptionId,
        userId
      });

      if (!prescription) {
        return false;
      }

      // Find the refill history entry by date
      const refillEntry = prescription.refillHistory.find(
        (entry: IRefillHistory) => entry.date.toISOString() === new Date(refillDate).toISOString()
      );

      if (refillEntry) {
        refillEntry.status = status;
        if (additionalInfo) {
          if (additionalInfo.estimatedReady) refillEntry.estimatedReady = additionalInfo.estimatedReady;
          if (additionalInfo.actualReady) refillEntry.actualReady = additionalInfo.actualReady;
          if (additionalInfo.pickedUp) refillEntry.pickedUp = additionalInfo.pickedUp;
          if (additionalInfo.notes) refillEntry.notes = additionalInfo.notes;
          if (additionalInfo.confirmationNumber) refillEntry.pharmacyConfirmationNumber = additionalInfo.confirmationNumber;
        }
      } else {
        // Create new entry if not found
        const newEntry: IRefillHistory = {
          date: new Date(refillDate),
          status,
          pharmacy: prescription.pharmacy,
          ...additionalInfo
        };
        prescription.refillHistory.push(newEntry);
      }

      await prescription.save();

      // Send notification for status changes
      try {
        if (status === 'ready') {
          await notificationService.sendNotification(userId, {
            type: 'prescription_refill_ready',
            title: 'Prescription Ready for Pickup',
            message: `Your refill for ${prescription.medicationName} is ready at ${prescription.pharmacy}.`,
            data: {
              prescriptionId: prescription._id.toString(),
              medicationName: prescription.medicationName,
              pharmacy: prescription.pharmacy
            }
          });
        }
      } catch (notificationError) {
        // Log but don't fail the status update if notification fails
        console.error('Error sending notification:', notificationError);
      }

      return true;
    } catch (error) {
      console.error('Error updating refill status:', error);
      return false;
    }
  }

  /**
   * Process automatic refills for all eligible prescriptions
   * This is called by the background worker
   */
  async processAutomaticRefills(userId?: string): Promise<{
    processed: number;
    successful: number;
    failed: number;
    details: Array<{ prescriptionId: string; medicationName: string; success: boolean; message: string }>;
  }> {
    try {
      await connectDB();

      let prescriptionsNeedingRefill: IPrescription[];

      if (userId) {
        // Process for specific user
        prescriptionsNeedingRefill = await this.checkRefillNeeds(userId);
      } else {
        // Process for all users with auto-refill enabled
        const allPrescriptions = await Prescription.find({
          isActive: true,
          autoRefillEnabled: true,
          refillsRemaining: { $gt: 0 }
        });

        prescriptionsNeedingRefill = [];
        const userIds = new Set<string>();

        for (const prescription of allPrescriptions) {
          const eligibility = this.canAutoRefill(prescription);
          if (eligibility.eligible && eligibility.canAutoRefill) {
            if (prescription.nextRefillDueDate) {
              const daysUntilDue = this.calculateDaysUntilDue(prescription.nextRefillDueDate);
              if (daysUntilDue <= prescription.autoRefillDaysBefore) {
                prescriptionsNeedingRefill.push(prescription);
                userIds.add(prescription.userId);
              }
            }
          }
        }
      }

      const results = {
        processed: prescriptionsNeedingRefill.length,
        successful: 0,
        failed: 0,
        details: [] as Array<{ prescriptionId: string; medicationName: string; success: boolean; message: string }>
      };

      // Process each prescription
      for (const prescription of prescriptionsNeedingRefill) {
        const prescriptionId = prescription._id?.toString() || prescription.id?.toString();
        if (!prescriptionId) {
          console.error('Prescription missing ID:', prescription);
          continue;
        }

        const result = await this.requestRefill(
          prescriptionId,
          prescription.userId,
          false // automatic request
        );

        if (result.success) {
          results.successful++;
        } else {
          results.failed++;
        }

        results.details.push({
          prescriptionId,
          medicationName: prescription.medicationName,
          success: result.success,
          message: result.message
        });
      }

      return results;
    } catch (error) {
      console.error('Error processing automatic refills:', error);
      throw error;
    }
  }
}

export const prescriptionRefillAutomationService = new PrescriptionRefillAutomationService();

