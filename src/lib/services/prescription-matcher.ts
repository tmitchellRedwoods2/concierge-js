/**
 * Prescription Matcher Service
 * Matches prescription refill emails to existing prescriptions in the database
 */

import connectDB from '@/lib/db/mongodb';
import Prescription from '@/lib/db/models/Prescription';
import { ParsedPrescriptionRefill } from './health-email-parser';

export interface MatchedPrescription {
  prescription: any; // IPrescription
  matchScore: number; // 0-1, how confident the match is
  matchReasons: string[];
}

export class PrescriptionMatcherService {
  /**
   * Find matching prescription for a refill email
   */
  async findMatchingPrescription(
    parsedRefill: ParsedPrescriptionRefill,
    userId: string
  ): Promise<MatchedPrescription | null> {
    await connectDB();

    // Get all active prescriptions for user
    const prescriptions = await Prescription.find({
      userId,
      isActive: true
    });

    if (prescriptions.length === 0) {
      return null;
    }

    let bestMatch: MatchedPrescription | null = null;
    let bestScore = 0;

    for (const prescription of prescriptions) {
      const match = this.calculateMatch(parsedRefill, prescription);
      
      if (match.matchScore > bestScore) {
        bestScore = match.matchScore;
        bestMatch = match;
      }
    }

    // Only return match if confidence is high enough (>= 0.6)
    if (bestMatch && bestMatch.matchScore >= 0.6) {
      return bestMatch;
    }

    return null;
  }

  /**
   * Calculate match score between parsed refill and prescription
   */
  private calculateMatch(
    parsedRefill: ParsedPrescriptionRefill,
    prescription: any
  ): MatchedPrescription {
    const reasons: string[] = [];
    let score = 0;

    // Match by medication name (40% weight)
    const medicationMatch = this.matchMedicationName(
      parsedRefill.medicationName,
      prescription.medicationName
    );
    if (medicationMatch.matched) {
      score += 0.4 * medicationMatch.confidence;
      reasons.push(`Medication name match: ${medicationMatch.reason}`);
    }

    // Match by pharmacy (30% weight)
    const pharmacyMatch = this.matchPharmacy(
      parsedRefill.pharmacy,
      prescription.pharmacy
    );
    if (pharmacyMatch.matched) {
      score += 0.3;
      reasons.push(`Pharmacy match: ${pharmacyMatch.reason}`);
    }

    // Match by dosage (20% weight)
    if (parsedRefill.dosage && prescription.dosage) {
      const dosageMatch = this.matchDosage(
        parsedRefill.dosage,
        prescription.dosage
      );
      if (dosageMatch.matched) {
        score += 0.2 * dosageMatch.confidence;
        reasons.push(`Dosage match: ${dosageMatch.reason}`);
      }
    }

    // Match by order/prescription number (10% weight) - if available
    if (parsedRefill.orderNumber || parsedRefill.prescriptionNumber) {
      // Check if this order number is in refill history
      if (prescription.refillHistory && prescription.refillHistory.length > 0) {
        const orderNumber = parsedRefill.orderNumber || parsedRefill.prescriptionNumber;
        const foundInHistory = prescription.refillHistory.some(
          (refill: any) => refill.orderNumber === orderNumber
        );
        if (foundInHistory) {
          score += 0.1;
          reasons.push(`Order number found in refill history`);
        }
      }
    }

    return {
      prescription,
      matchScore: Math.min(score, 1.0),
      matchReasons: reasons
    };
  }

  /**
   * Match medication names (fuzzy matching)
   */
  private matchMedicationName(
    parsedName: string,
    prescriptionName: string
  ): { matched: boolean; confidence: number; reason: string } {
    const parsed = parsedName.toLowerCase().trim();
    const prescription = prescriptionName.toLowerCase().trim();

    // Exact match
    if (parsed === prescription) {
      return { matched: true, confidence: 1.0, reason: 'Exact match' };
    }

    // Check if parsed name contains prescription name or vice versa
    if (parsed.includes(prescription) || prescription.includes(parsed)) {
      return { matched: true, confidence: 0.8, reason: 'Partial match' };
    }

    // Remove common suffixes and compare
    const parsedBase = parsed.replace(/\s*(mg|ml|g|tab|tablet|cap|capsule|iu)\s*/gi, '').trim();
    const prescriptionBase = prescription.replace(/\s*(mg|ml|g|tab|tablet|cap|capsule|iu)\s*/gi, '').trim();

    if (parsedBase === prescriptionBase) {
      return { matched: true, confidence: 0.9, reason: 'Base name match' };
    }

    // Check if base names contain each other
    if (parsedBase.includes(prescriptionBase) || prescriptionBase.includes(parsedBase)) {
      return { matched: true, confidence: 0.7, reason: 'Base name partial match' };
    }

    // Word-by-word comparison (at least 50% words match)
    const parsedWords = parsedBase.split(/\s+/);
    const prescriptionWords = prescriptionBase.split(/\s+/);
    const matchingWords = parsedWords.filter(word => 
      prescriptionWords.some(pWord => word === pWord || word.includes(pWord) || pWord.includes(word))
    );
    const matchRatio = matchingWords.length / Math.max(parsedWords.length, prescriptionWords.length);

    if (matchRatio >= 0.5) {
      return { 
        matched: true, 
        confidence: matchRatio, 
        reason: `${Math.round(matchRatio * 100)}% word match` 
      };
    }

    return { matched: false, confidence: 0, reason: 'No match' };
  }

  /**
   * Match pharmacy names
   */
  private matchPharmacy(
    parsedPharmacy: string,
    prescriptionPharmacy: string
  ): { matched: boolean; reason: string } {
    const parsed = parsedPharmacy.toLowerCase().trim();
    const prescription = prescriptionPharmacy.toLowerCase().trim();

    // Normalize pharmacy names
    const pharmacyMap: Record<string, string[]> = {
      'cvs': ['cvs pharmacy', 'cvs'],
      'walgreens': ['walgreens', 'walgreen'],
      'rite aid': ['rite aid', 'riteaid', 'rite-aid'],
      'fullscript': ['fullscript', 'full script'],
      'kroger': ['kroger'],
      'safeway': ['safeway'],
      'walmart': ['walmart'],
      'target': ['target'],
      'costco': ['costco']
    };

    // Check if they match directly
    if (parsed === prescription) {
      return { matched: true, reason: 'Exact pharmacy match' };
    }

    // Check if they're in the same pharmacy group
    for (const [key, variants] of Object.entries(pharmacyMap)) {
      const parsedInGroup = variants.some(v => parsed.includes(v));
      const prescriptionInGroup = variants.some(v => prescription.includes(v));
      
      if (parsedInGroup && prescriptionInGroup) {
        return { matched: true, reason: `Pharmacy group match: ${key}` };
      }
    }

    // Check if one contains the other
    if (parsed.includes(prescription) || prescription.includes(parsed)) {
      return { matched: true, reason: 'Partial pharmacy match' };
    }

    return { matched: false, reason: 'No pharmacy match' };
  }

  /**
   * Match dosage
   */
  private matchDosage(
    parsedDosage: string,
    prescriptionDosage: string
  ): { matched: boolean; confidence: number; reason: string } {
    const parsed = parsedDosage.toLowerCase().trim();
    const prescription = prescriptionDosage.toLowerCase().trim();

    // Exact match
    if (parsed === prescription) {
      return { matched: true, confidence: 1.0, reason: 'Exact dosage match' };
    }

    // Normalize and compare (remove spaces, standardize units)
    const normalize = (dosage: string) => {
      return dosage
        .replace(/\s+/g, '')
        .replace(/mg/gi, 'mg')
        .replace(/ml/gi, 'ml')
        .replace(/g\b/gi, 'g')
        .toLowerCase();
    };

    const parsedNormalized = normalize(parsed);
    const prescriptionNormalized = normalize(prescription);

    if (parsedNormalized === prescriptionNormalized) {
      return { matched: true, confidence: 0.9, reason: 'Normalized dosage match' };
    }

    // Extract numeric values and compare
    const parsedNumber = parseFloat(parsed.replace(/[^\d.]/g, ''));
    const prescriptionNumber = parseFloat(prescription.replace(/[^\d.]/g, ''));

    if (!isNaN(parsedNumber) && !isNaN(prescriptionNumber)) {
      if (parsedNumber === prescriptionNumber) {
        return { matched: true, confidence: 0.7, reason: 'Numeric dosage match' };
      }
    }

    return { matched: false, confidence: 0, reason: 'No dosage match' };
  }
}

// Singleton instance
export const prescriptionMatcherService = new PrescriptionMatcherService();

