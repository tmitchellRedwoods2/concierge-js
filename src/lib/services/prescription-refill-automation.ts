/**
 * Prescription Refill Automation Service
 * Handles automatic prescription refill requests from pharmacy emails
 */

import connectDB from '@/lib/db/mongodb';
import Prescription from '@/lib/db/models/Prescription';
import { ParsedPrescriptionRefill } from './health-email-parser';
import { prescriptionMatcherService, MatchedPrescription } from './prescription-matcher';
import { NotificationService } from './notification-service';

export interface RefillRequestResult {
  success: boolean;
  prescriptionId?: string;
  refillRequested?: boolean;
  message: string;
  estimatedReadyDate?: Date;
  pharmacyConfirmation?: string;
  error?: string;
}

export class PrescriptionRefillAutomationService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Process prescription refill from parsed email
   */
  async processRefillRequest(
    parsedRefill: ParsedPrescriptionRefill,
    userId: string,
    autoRequest: boolean = false
  ): Promise<RefillRequestResult> {
    try {
      await connectDB();

      // Find matching prescription
      const match = await prescriptionMatcherService.findMatchingPrescription(
        parsedRefill,
        userId
      );

      if (!match) {
        return {
          success: false,
          message: 'No matching prescription found',
          error: 'Could not match refill email to existing prescription'
        };
      }

      const prescription = match.prescription;

      // Check if prescription is eligible for refill
      const eligibilityCheck = this.checkRefillEligibility(prescription, parsedRefill);
      if (!eligibilityCheck.eligible) {
        return {
          success: false,
          prescriptionId: prescription._id.toString(),
          message: eligibilityCheck.reason,
          error: eligibilityCheck.reason
        };
      }

      // Request refill if auto-request is enabled or explicitly requested
      if (autoRequest || prescription.autoRefillEnabled) {
        const refillResult = await this.requestRefill(prescription, parsedRefill);
        
        // Update prescription
        await this.updatePrescriptionAfterRefill(prescription, parsedRefill, refillResult);

        // Send notification
        await this.sendRefillNotification(prescription, parsedRefill, refillResult, userId);

        return {
          success: true,
          prescriptionId: prescription._id.toString(),
          refillRequested: true,
          message: 'Refill requested successfully',
          estimatedReadyDate: refillResult.estimatedReadyDate,
          pharmacyConfirmation: refillResult.confirmation
        };
      } else {
        // Just notify user that refill is available
        await this.sendRefillAvailableNotification(prescription, parsedRefill, userId);

        return {
          success: true,
          prescriptionId: prescription._id.toString(),
          refillRequested: false,
          message: 'Refill available - user notification sent',
        };
      }
    } catch (error) {
      console.error('Error processing refill request:', error);
      return {
        success: false,
        message: 'Failed to process refill request',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if prescription is eligible for refill
   */
  private checkRefillEligibility(
    prescription: any,
    parsedRefill: ParsedPrescriptionRefill
  ): { eligible: boolean; reason: string } {
    // Check if prescription is active
    if (!prescription.isActive) {
      return { eligible: false, reason: 'Prescription is not active' };
    }

    // Check if refills remaining
    if (prescription.refillsRemaining <= 0) {
      return { eligible: false, reason: 'No refills remaining' };
    }

    // Check if refill date is valid (if provided)
    if (parsedRefill.refillByDate) {
      const now = new Date();
      if (parsedRefill.refillByDate < now) {
        return { eligible: false, reason: 'Refill deadline has passed' };
      }
    }

    // Check if recently requested (avoid duplicates)
    if (prescription.lastRefillRequestDate) {
      const lastRequest = new Date(prescription.lastRefillRequestDate);
      const daysSinceLastRequest = (Date.now() - lastRequest.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastRequest < 1) {
        return { eligible: false, reason: 'Refill already requested within last 24 hours' };
      }
    }

    return { eligible: true, reason: 'Eligible for refill' };
  }

  /**
   * Request refill from pharmacy (email-based for now)
   */
  private async requestRefill(
    prescription: any,
    parsedRefill: ParsedPrescriptionRefill
  ): Promise<{
    success: boolean;
    confirmation?: string;
    estimatedReadyDate?: Date;
    error?: string;
  }> {
    // For now, we'll simulate the refill request
    // In the future, this will integrate with pharmacy APIs or send formatted emails
    
    const estimatedReadyDate = new Date();
    estimatedReadyDate.setDate(estimatedReadyDate.getDate() + 1); // Typically ready next day

    const confirmation = parsedRefill.orderNumber 
      ? `Refill #${parsedRefill.orderNumber} submitted`
      : `Refill request submitted for ${prescription.medicationName}`;

    console.log(`📋 Refill requested: ${prescription.medicationName} at ${parsedRefill.pharmacy}`);

    // TODO: Implement actual pharmacy integration
    // - Send email to pharmacy with refill request
    // - Or call pharmacy API if available
    // - Parse confirmation response

    return {
      success: true,
      confirmation,
      estimatedReadyDate
    };
  }

  /**
   * Update prescription after refill request
   */
  private async updatePrescriptionAfterRefill(
    prescription: any,
    parsedRefill: ParsedPrescriptionRefill,
    refillResult: { confirmation?: string; estimatedReadyDate?: Date }
  ): Promise<void> {
    await connectDB();

    // Initialize refillHistory if it doesn't exist
    if (!prescription.refillHistory) {
      prescription.refillHistory = [];
    }

    // Add refill to history
    prescription.refillHistory.push({
      date: new Date(),
      orderNumber: parsedRefill.orderNumber || parsedRefill.prescriptionNumber,
      status: 'requested',
      notes: refillResult.confirmation
    });

    // Update prescription
    prescription.lastRefillRequestDate = new Date();
    prescription.refillsRemaining = Math.max(0, prescription.refillsRemaining - 1);
    
    // Update next auto-refill date if set
    if (prescription.nextAutoRefillDate) {
      // Calculate next refill date based on frequency
      const nextRefill = this.calculateNextRefillDate(prescription);
      prescription.nextAutoRefillDate = nextRefill;
    }

    await prescription.save();
  }

  /**
   * Calculate next refill date based on prescription frequency
   */
  private calculateNextRefillDate(prescription: any): Date {
    const now = new Date();
    const nextRefill = new Date(now);

    // Estimate based on quantity and frequency
    // This is a simplified calculation - in production, you'd want more sophisticated logic
    const quantity = prescription.quantity || 30; // Default to 30 days
    const frequency = prescription.frequency?.toLowerCase() || 'daily';

    if (frequency.includes('daily') || frequency.includes('once')) {
      nextRefill.setDate(nextRefill.getDate() + quantity);
    } else if (frequency.includes('twice')) {
      nextRefill.setDate(nextRefill.getDate() + Math.ceil(quantity / 2));
    } else if (frequency.includes('weekly')) {
      nextRefill.setDate(nextRefill.getDate() + (quantity * 7));
    } else {
      // Default to 30 days
      nextRefill.setDate(nextRefill.getDate() + 30);
    }

    return nextRefill;
  }

  /**
   * Send notification when refill is requested
   */
  private async sendRefillNotification(
    prescription: any,
    parsedRefill: ParsedPrescriptionRefill,
    refillResult: { confirmation?: string; estimatedReadyDate?: Date },
    userId: string
  ): Promise<void> {
    try {
      // TODO: Create prescription refill notification template
      // For now, use a simple email notification
      const message = `Your prescription refill for ${prescription.medicationName} has been requested at ${parsedRefill.pharmacy}. ` +
        `Estimated ready date: ${refillResult.estimatedReadyDate?.toLocaleDateString() || 'Next business day'}. ` +
        `Confirmation: ${refillResult.confirmation || 'Refill request submitted'}`;

      console.log(`📧 Refill notification sent to user ${userId}`);
      // TODO: Integrate with notification service
    } catch (error) {
      console.error('Error sending refill notification:', error);
      // Don't throw - notification failure shouldn't block refill request
    }
  }

  /**
   * Send notification when refill is available (but not auto-requested)
   */
  private async sendRefillAvailableNotification(
    prescription: any,
    parsedRefill: ParsedPrescriptionRefill,
    userId: string
  ): Promise<void> {
    try {
      const message = `Your prescription ${prescription.medicationName} is ready for refill at ${parsedRefill.pharmacy}. ` +
        `Refill by: ${parsedRefill.refillByDate?.toLocaleDateString() || 'See email for details'}. ` +
        `You can enable auto-refill in your prescription settings.`;

      console.log(`📧 Refill available notification sent to user ${userId}`);
      // TODO: Integrate with notification service
    } catch (error) {
      console.error('Error sending refill available notification:', error);
    }
  }
}

// Singleton instance
export const prescriptionRefillAutomationService = new PrescriptionRefillAutomationService();

