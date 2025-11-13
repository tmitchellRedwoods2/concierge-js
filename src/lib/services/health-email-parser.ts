/**
 * Health Email Parser Service
 * Extracts health-related information from email content
 * Supports: Prescription refills, Lab results, Medical bills, Appointment availability
 */

import { EmailParserService } from './email-parser';

export interface ParsedPrescriptionRefill {
  type: 'prescription_refill';
  medicationName: string;
  dosage?: string;
  pharmacy: string;
  refillByDate?: Date;
  orderNumber?: string;
  prescriptionNumber?: string;
  readyForPickup?: boolean;
  confidence: number;
}

export interface ParsedLabResults {
  type: 'lab_results';
  labName: string;
  testDate: Date;
  testTypes: string[];
  accessUrl?: string;
  hasAttachment?: boolean;
  confidence: number;
}

export interface ParsedMedicalBill {
  type: 'medical_bill';
  provider: string;
  service: string;
  amount: number;
  statementDate: Date;
  dueDate: Date;
  serviceDate?: Date;
  confidence: number;
}

export interface ParsedAppointmentAvailability {
  type: 'appointment_availability';
  doctorName: string;
  availableTimes: Array<{
    date: Date;
    time: string;
  }>;
  appointmentType?: string;
  confidence: number;
}

export type ParsedHealthEmail = 
  | ParsedPrescriptionRefill 
  | ParsedLabResults 
  | ParsedMedicalBill 
  | ParsedAppointmentAvailability;

export class HealthEmailParserService {
  private emailParser: EmailParserService;

  constructor() {
    this.emailParser = new EmailParserService();
  }

  /**
   * Parse health-related email and determine type
   */
  parseHealthEmail(email: {
    from: string;
    subject: string;
    body: string;
  }): ParsedHealthEmail | null {
    const text = `${email.subject} ${email.body}`.toLowerCase();
    const from = email.from.toLowerCase();

    // Try prescription refill first (most common)
    const prescriptionRefill = this.parsePrescriptionRefill(email);
    if (prescriptionRefill) return prescriptionRefill;

    // Try lab results
    const labResults = this.parseLabResults(email);
    if (labResults) return labResults;

    // Try medical bill
    const medicalBill = this.parseMedicalBill(email);
    if (medicalBill) return medicalBill;

    // Try appointment availability
    const appointmentAvailability = this.parseAppointmentAvailability(email);
    if (appointmentAvailability) return appointmentAvailability;

    return null;
  }

  /**
   * Parse prescription refill email
   */
  private parsePrescriptionRefill(email: {
    from: string;
    subject: string;
    body: string;
  }): ParsedPrescriptionRefill | null {
    const text = `${email.subject} ${email.body}`;
    const from = email.from.toLowerCase();
    const subject = email.subject.toLowerCase();
    const body = email.body.toLowerCase();

    // Check if from known pharmacy
    const pharmacyDomains = [
      'cvs.com', 'walgreens.com', 'riteaid.com', 'rite-aid.com',
      'fullscript.com', 'kroger.com', 'safeway.com', 'walmart.com',
      'target.com', 'costco.com'
    ];

    const isPharmacyEmail = pharmacyDomains.some(domain => from.includes(domain));
    if (!isPharmacyEmail) {
      return null;
    }

    // Check for refill keywords
    const refillKeywords = ['refill', 'prescription', 'ready', 'available', 'order'];
    const hasRefillKeyword = refillKeywords.some(keyword => 
      subject.includes(keyword) || body.includes(keyword)
    );

    if (!hasRefillKeyword) {
      return null;
    }

    // Extract pharmacy name
    const pharmacy = this.extractPharmacyName(from, subject);

    // Extract medication name
    const medicationName = this.extractMedicationName(text);

    // Extract dosage
    const dosage = this.extractDosage(text);

    // Extract refill date
    const refillByDate = this.extractRefillDate(text);

    // Extract order/prescription number
    const orderNumber = this.extractOrderNumber(text);
    const prescriptionNumber = this.extractPrescriptionNumber(text);

    // Check if ready for pickup
    const readyForPickup = body.includes('ready') || body.includes('available') || 
                          body.includes('pickup') || body.includes('pick up');

    // Calculate confidence
    const confidence = this.calculateRefillConfidence({
      hasPharmacy: !!pharmacy,
      hasMedication: !!medicationName,
      hasOrderNumber: !!orderNumber || !!prescriptionNumber,
      hasDate: !!refillByDate
    });

    if (confidence < 0.5) {
      return null;
    }

    return {
      type: 'prescription_refill',
      medicationName: medicationName || 'Unknown Medication',
      dosage,
      pharmacy,
      refillByDate,
      orderNumber,
      prescriptionNumber,
      readyForPickup,
      confidence
    };
  }

  /**
   * Parse lab results email
   */
  private parseLabResults(email: {
    from: string;
    subject: string;
    body: string;
  }): ParsedLabResults | null {
    const text = `${email.subject} ${email.body}`;
    const from = email.from.toLowerCase();
    const subject = email.subject.toLowerCase();
    const body = email.body.toLowerCase();

    // Check if from known lab
    const labDomains = [
      'labcorp.com', 'questdiagnostics.com', 'quest.com',
      'sonoraquest.com', 'mayocliniclabs.com', 'clevelandcliniclabs.com'
    ];

    const isLabEmail = labDomains.some(domain => from.includes(domain));
    if (!isLabEmail) {
      return null;
    }

    // Check for lab result keywords
    const labKeywords = ['results', 'test results', 'lab results', 'available', 'ready'];
    const hasLabKeyword = labKeywords.some(keyword => 
      subject.includes(keyword) || body.includes(keyword)
    );

    if (!hasLabKeyword) {
      return null;
    }

    // Extract lab name
    const labName = this.extractLabName(from, subject);

    // Extract test date
    const testDate = this.extractTestDate(text) || new Date();

    // Extract test types
    const testTypes = this.extractTestTypes(text);

    // Extract access URL
    const accessUrl = this.extractAccessUrl(text);

    // Check for attachment
    const hasAttachment = body.includes('attachment') || body.includes('attached') ||
                         body.includes('pdf') || body.includes('download');

    const confidence = this.calculateLabResultsConfidence({
      hasLab: !!labName,
      hasTestTypes: testTypes.length > 0,
      hasUrl: !!accessUrl,
      hasDate: !!testDate
    });

    if (confidence < 0.5) {
      return null;
    }

    return {
      type: 'lab_results',
      labName: labName || 'Unknown Lab',
      testDate,
      testTypes,
      accessUrl,
      hasAttachment,
      confidence
    };
  }

  /**
   * Parse medical bill email
   */
  private parseMedicalBill(email: {
    from: string;
    subject: string;
    body: string;
  }): ParsedMedicalBill | null {
    const text = `${email.subject} ${email.body}`;
    const subject = email.subject.toLowerCase();
    const body = email.body.toLowerCase();

    // Check for bill keywords
    const billKeywords = ['statement', 'bill', 'invoice', 'amount due', 'balance due'];
    const hasBillKeyword = billKeywords.some(keyword => 
      subject.includes(keyword) || body.includes(keyword)
    );

    if (!hasBillKeyword) {
      return null;
    }

    // Extract amount
    const amount = this.extractAmount(text);

    // Extract provider
    const provider = this.extractProvider(text, email.from);

    // Extract service description
    const service = this.extractService(text);

    // Extract dates
    const statementDate = this.extractStatementDate(text) || new Date();
    const dueDate = this.extractDueDate(text) || new Date();
    const serviceDate = this.extractServiceDate(text);

    const confidence = this.calculateBillConfidence({
      hasAmount: amount > 0,
      hasProvider: !!provider,
      hasService: !!service,
      hasDueDate: !!dueDate
    });

    if (confidence < 0.5) {
      return null;
    }

    return {
      type: 'medical_bill',
      provider: provider || 'Unknown Provider',
      service: service || 'Medical Service',
      amount,
      statementDate,
      dueDate,
      serviceDate,
      confidence
    };
  }

  /**
   * Parse appointment availability email
   */
  private parseAppointmentAvailability(email: {
    from: string;
    subject: string;
    body: string;
  }): ParsedAppointmentAvailability | null {
    const text = `${email.subject} ${email.body}`;
    const subject = email.subject.toLowerCase();
    const body = email.body.toLowerCase();

    // Check for availability keywords
    const availabilityKeywords = ['available', 'availability', 'times', 'schedule', 'appointment'];
    const hasAvailabilityKeyword = availabilityKeywords.some(keyword => 
      subject.includes(keyword) || body.includes(keyword)
    );

    if (!hasAvailabilityKeyword) {
      return null;
    }

    // Extract doctor name
    const doctorName = this.extractDoctorName(email.from, subject, body);

    // Extract available times
    const availableTimes = this.extractAvailableTimes(text);

    // Extract appointment type
    const appointmentType = this.extractAppointmentType(text);

    if (availableTimes.length === 0) {
      return null;
    }

    const confidence = this.calculateAvailabilityConfidence({
      hasDoctor: !!doctorName,
      hasTimes: availableTimes.length > 0,
      hasMultipleTimes: availableTimes.length > 1
    });

    return {
      type: 'appointment_availability',
      doctorName: doctorName || 'Unknown Doctor',
      availableTimes,
      appointmentType,
      confidence
    };
  }

  // Helper methods for extraction

  private extractPharmacyName(from: string, subject: string): string {
    const pharmacyMap: Record<string, string> = {
      'cvs': 'CVS Pharmacy',
      'walgreens': 'Walgreens',
      'riteaid': 'Rite Aid',
      'rite-aid': 'Rite Aid',
      'fullscript': 'Fullscript',
      'kroger': 'Kroger',
      'safeway': 'Safeway',
      'walmart': 'Walmart',
      'target': 'Target',
      'costco': 'Costco'
    };

    for (const [key, name] of Object.entries(pharmacyMap)) {
      if (from.includes(key) || subject.includes(key)) {
        return name;
      }
    }

    // Try to extract from email domain
    const domainMatch = from.match(/@([^.]+)/);
    if (domainMatch) {
      return domainMatch[1].charAt(0).toUpperCase() + domainMatch[1].slice(1);
    }

    return 'Unknown Pharmacy';
  }

  private extractMedicationName(text: string): string | null {
    // Look for medication name patterns
    // Common patterns: "for [MEDICATION]", "prescription for [MEDICATION]", "[MEDICATION] is ready"
    const patterns = [
      /(?:for|prescription for)\s+([A-Z][A-Z\s]+(?:MG|TAB|CAP|ML|G|IU)?)/i,
      /([A-Z][A-Z\s]+(?:MG|TAB|CAP|ML|G|IU)?)\s+(?:is ready|available|for refill)/i,
      /medication[:\s]+([A-Z][A-Z\s]+(?:MG|TAB|CAP|ML|G|IU)?)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  private extractDosage(text: string): string | undefined {
    // Look for dosage patterns: "10MG", "10 MG", "10mg TAB", etc.
    const dosagePattern = /(\d+\s*(?:MG|mg|ML|ml|G|g|IU|iu)\s*(?:TAB|TABLET|CAP|CAPSULE|ML|G)?)/i;
    const match = text.match(dosagePattern);
    return match ? match[1].trim() : undefined;
  }

  private extractRefillDate(text: string): Date | undefined {
    // Use the email parser's date extraction
    const dateTime = (this.emailParser as any).extractDateTime('', text);
    return dateTime.startDate || undefined;
  }

  private extractOrderNumber(text: string): string | undefined {
    // Look for order number patterns: "Order #12345", "Order Number: 12345", "Ref #12345"
    const patterns = [
      /order\s*[#:]?\s*(\d+)/i,
      /ref\s*[#:]?\s*(\d+)/i,
      /order\s+number[:\s]+(\d+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  private extractPrescriptionNumber(text: string): string | undefined {
    // Look for prescription number patterns
    const patterns = [
      /prescription\s*[#:]?\s*(\d+)/i,
      /rx\s*[#:]?\s*(\d+)/i,
      /prescription\s+number[:\s]+(\d+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  private extractLabName(from: string, subject: string): string {
    const labMap: Record<string, string> = {
      'labcorp': 'LabCorp',
      'quest': 'Quest Diagnostics',
      'questdiagnostics': 'Quest Diagnostics',
      'sonoraquest': 'Sonora Quest',
      'mayoclinic': 'Mayo Clinic Labs',
      'clevelandclinic': 'Cleveland Clinic Labs'
    };

    for (const [key, name] of Object.entries(labMap)) {
      if (from.includes(key) || subject.includes(key)) {
        return name;
      }
    }

    return 'Unknown Lab';
  }

  private extractTestDate(text: string): Date | undefined {
    const dateTime = (this.emailParser as any).extractDateTime('', text);
    return dateTime.startDate || undefined;
  }

  private extractTestTypes(text: string): string[] {
    const testTypes: string[] = [];
    
    // Common test type patterns
    const commonTests = [
      'Complete Blood Count', 'CBC', 'Lipid Panel', 'Cholesterol',
      'Blood Glucose', 'A1C', 'Hemoglobin', 'Thyroid', 'TSH',
      'Vitamin D', 'B12', 'Iron', 'Liver Function', 'Kidney Function',
      'PSA', 'Mammogram', 'Colonoscopy', 'Pap Smear'
    ];

    for (const test of commonTests) {
      if (text.toLowerCase().includes(test.toLowerCase())) {
        testTypes.push(test);
      }
    }

    return testTypes;
  }

  private extractAccessUrl(text: string): string | undefined {
    // Look for URLs
    const urlPattern = /https?:\/\/[^\s]+/i;
    const match = text.match(urlPattern);
    return match ? match[0] : undefined;
  }

  private extractAmount(text: string): number {
    // Look for amount patterns: "$250.00", "Amount Due: $250", "Balance: $250.00"
    const patterns = [
      /\$(\d+(?:\.\d{2})?)/,
      /amount\s+due[:\s]+\$?(\d+(?:\.\d{2})?)/i,
      /balance[:\s]+\$?(\d+(?:\.\d{2})?)/i,
      /total[:\s]+\$?(\d+(?:\.\d{2})?)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return parseFloat(match[1]);
      }
    }

    return 0;
  }

  private extractProvider(text: string, from: string): string | null {
    // Try to extract from "from" field first
    const fromMatch = from.match(/([^<@]+)/);
    if (fromMatch) {
      const name = fromMatch[1].trim();
      if (name && name.length > 2 && name.length < 100) {
        return name;
      }
    }

    // Look for provider patterns in text
    const providerPatterns = [
      /provider[:\s]+([A-Z][^,\n]+)/i,
      /doctor[:\s]+([A-Z][^,\n]+)/i,
      /physician[:\s]+([A-Z][^,\n]+)/i
    ];

    for (const pattern of providerPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  private extractService(text: string): string | null {
    // Look for service description
    const servicePatterns = [
      /service[:\s]+([A-Z][^,\n]+)/i,
      /procedure[:\s]+([A-Z][^,\n]+)/i,
      /description[:\s]+([A-Z][^,\n]+)/i
    ];

    for (const pattern of servicePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  private extractStatementDate(text: string): Date | undefined {
    // Look for "Statement Date: ..."
    const statementPattern = /statement\s+date[:\s]+([^\n]+)/i;
    const match = text.match(statementPattern);
    if (match) {
      const dateTime = (this.emailParser as any).extractDateTime('', match[1]);
      return dateTime.startDate || undefined;
    }
    return undefined;
  }

  private extractDueDate(text: string): Date | undefined {
    // Look for "Due Date: ..."
    const duePattern = /due\s+date[:\s]+([^\n]+)/i;
    const match = text.match(duePattern);
    if (match) {
      const dateTime = (this.emailParser as any).extractDateTime('', match[1]);
      return dateTime.startDate || undefined;
    }
    return undefined;
  }

  private extractServiceDate(text: string): Date | undefined {
    // Look for "Service Date: ..." or "Date of Service: ..."
    const servicePattern = /(?:service\s+date|date\s+of\s+service)[:\s]+([^\n]+)/i;
    const match = text.match(servicePattern);
    if (match) {
      const dateTime = (this.emailParser as any).extractDateTime('', match[1]);
      return dateTime.startDate || undefined;
    }
    return undefined;
  }

  private extractDoctorName(from: string, subject: string, body: string): string | null {
    // Use the email parser's doctor name extraction
    return (this.emailParser as any).extractDoctorName(from, subject, body) || null;
  }

  private extractAvailableTimes(text: string): Array<{ date: Date; time: string }> {
    const times: Array<{ date: Date; time: string }> = [];
    
    // Look for time patterns: "January 20, 2024 at 10:00 AM"
    const timePattern = /([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})\s+at\s+(\d{1,2}:\d{2}\s*(?:AM|PM))/gi;
    const matches = [...text.matchAll(timePattern)];
    
    for (const match of matches) {
      const dateStr = match[1];
      const timeStr = match[2];
      const date = new Date(dateStr);
      
      if (!isNaN(date.getTime())) {
        times.push({ date, time: timeStr });
      }
    }

    // Also try bullet points or list format
    const listPattern = /[-•]\s*([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})\s+at\s+(\d{1,2}:\d{2}\s*(?:AM|PM))/gi;
    const listMatches = [...text.matchAll(listPattern)];
    
    for (const match of listMatches) {
      const dateStr = match[1];
      const timeStr = match[2];
      const date = new Date(dateStr);
      
      if (!isNaN(date.getTime())) {
        times.push({ date, time: timeStr });
      }
    }

    return times;
  }

  private extractAppointmentType(text: string): string | undefined {
    const types = ['annual physical', 'checkup', 'follow-up', 'consultation', 'exam'];
    for (const type of types) {
      if (text.toLowerCase().includes(type)) {
        return type;
      }
    }
    return undefined;
  }

  // Confidence calculation methods

  private calculateRefillConfidence(extracted: {
    hasPharmacy: boolean;
    hasMedication: boolean;
    hasOrderNumber: boolean;
    hasDate: boolean;
  }): number {
    let score = 0;
    if (extracted.hasPharmacy) score += 0.3;
    if (extracted.hasMedication) score += 0.4;
    if (extracted.hasOrderNumber) score += 0.2;
    if (extracted.hasDate) score += 0.1;
    return Math.min(score, 1.0);
  }

  private calculateLabResultsConfidence(extracted: {
    hasLab: boolean;
    hasTestTypes: boolean;
    hasUrl: boolean;
    hasDate: boolean;
  }): number {
    let score = 0;
    if (extracted.hasLab) score += 0.3;
    if (extracted.hasTestTypes) score += 0.4;
    if (extracted.hasUrl) score += 0.2;
    if (extracted.hasDate) score += 0.1;
    return Math.min(score, 1.0);
  }

  private calculateBillConfidence(extracted: {
    hasAmount: boolean;
    hasProvider: boolean;
    hasService: boolean;
    hasDueDate: boolean;
  }): number {
    let score = 0;
    if (extracted.hasAmount) score += 0.3;
    if (extracted.hasProvider) score += 0.3;
    if (extracted.hasService) score += 0.2;
    if (extracted.hasDueDate) score += 0.2;
    return Math.min(score, 1.0);
  }

  private calculateAvailabilityConfidence(extracted: {
    hasDoctor: boolean;
    hasTimes: boolean;
    hasMultipleTimes: boolean;
  }): number {
    let score = 0;
    if (extracted.hasDoctor) score += 0.3;
    if (extracted.hasTimes) score += 0.5;
    if (extracted.hasMultipleTimes) score += 0.2;
    return Math.min(score, 1.0);
  }
}

// Singleton instance
export const healthEmailParserService = new HealthEmailParserService();

