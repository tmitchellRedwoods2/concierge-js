/**
 * Pharmacy Email Parser Service
 * 
 * Parses emails from pharmacies to extract refill status updates,
 * ready notifications, and other prescription-related information.
 */

export interface ParsedPharmacyEmail {
  type: 'refill_ready' | 'refill_processing' | 'refill_delayed' | 'refill_cancelled' | 'refill_reminder' | 'unknown';
  pharmacy: string;
  medicationName?: string;
  prescriptionNumber?: string;
  status: 'ready' | 'processing' | 'delayed' | 'cancelled' | 'pending';
  estimatedReadyDate?: Date;
  actualReadyDate?: Date;
  pickupLocation?: string;
  confirmationNumber?: string;
  message?: string;
  rawText: string;
}

export class PharmacyEmailParser {
  /**
   * Parse an email from a pharmacy to extract refill information
   */
  parseEmail(email: {
    subject: string;
    body: string;
    from: string;
    text?: string;
    html?: string;
  }): ParsedPharmacyEmail {
    const text = email.text || this.htmlToText(email.html || email.body);
    const subject = email.subject.toLowerCase();
    const body = text.toLowerCase();
    const from = email.from.toLowerCase();

    // Identify pharmacy from sender
    const pharmacy = this.identifyPharmacy(from);

    // Check for different email types
    if (this.isRefillReadyEmail(subject, body)) {
      return this.parseRefillReadyEmail(subject, text, pharmacy);
    }

    if (this.isRefillProcessingEmail(subject, body)) {
      return this.parseRefillProcessingEmail(subject, text, pharmacy);
    }

    if (this.isRefillDelayedEmail(subject, body)) {
      return this.parseRefillDelayedEmail(subject, text, pharmacy);
    }

    if (this.isRefillCancelledEmail(subject, body)) {
      return this.parseRefillCancelledEmail(subject, text, pharmacy);
    }

    if (this.isRefillReminderEmail(subject, body)) {
      return this.parseRefillReminderEmail(subject, text, pharmacy);
    }

    // Default: unknown type
    return {
      type: 'unknown',
      pharmacy,
      status: 'pending',
      rawText: text
    };
  }

  /**
   * Identify pharmacy from email sender
   */
  private identifyPharmacy(from: string): string {
    if (from.includes('cvs') || from.includes('cvs.com')) {
      return 'cvs';
    }
    if (from.includes('walgreens') || from.includes('walgreens.com')) {
      return 'walgreens';
    }
    if (from.includes('riteaid') || from.includes('rite-aid') || from.includes('riteaid.com')) {
      return 'rite_aid';
    }
    if (from.includes('fullscript') || from.includes('fullscript.com')) {
      return 'fullscript';
    }
    // Default to generic pharmacy
    return 'local';
  }

  /**
   * Check if email is a "refill ready" notification
   */
  private isRefillReadyEmail(subject: string, body: string): boolean {
    const readyKeywords = [
      'ready for pickup',
      'ready to pick up',
      'is ready',
      'available for pickup',
      'ready',
      'pickup ready',
      'prescription ready'
    ];

    return readyKeywords.some(keyword => 
      subject.includes(keyword) || body.includes(keyword)
    );
  }

  /**
   * Check if email is a "refill processing" notification
   */
  private isRefillProcessingEmail(subject: string, body: string): boolean {
    const processingKeywords = [
      'processing',
      'in progress',
      'being filled',
      'filling your prescription',
      'working on your order'
    ];

    return processingKeywords.some(keyword => 
      subject.includes(keyword) || body.includes(keyword)
    );
  }

  /**
   * Check if email is a "refill delayed" notification
   */
  private isRefillDelayedEmail(subject: string, body: string): boolean {
    const delayedKeywords = [
      'delayed',
      'delay',
      'out of stock',
      'backordered',
      'unavailable',
      'will take longer'
    ];

    return delayedKeywords.some(keyword => 
      subject.includes(keyword) || body.includes(keyword)
    );
  }

  /**
   * Check if email is a "refill cancelled" notification
   */
  private isRefillCancelledEmail(subject: string, body: string): boolean {
    const cancelledKeywords = [
      'cancelled',
      'canceled',
      'cancellation',
      'unable to fill',
      'cannot be filled'
    ];

    return cancelledKeywords.some(keyword => 
      subject.includes(keyword) || body.includes(keyword)
    );
  }

  /**
   * Check if email is a "refill reminder" notification
   */
  private isRefillReminderEmail(subject: string, body: string): boolean {
    const reminderKeywords = [
      'refill reminder',
      'time to refill',
      'due for refill',
      'refill due',
      'prescription reminder'
    ];

    return reminderKeywords.some(keyword => 
      subject.includes(keyword) || body.includes(keyword)
    );
  }

  /**
   * Parse a "refill ready" email
   */
  private parseRefillReadyEmail(subject: string, text: string, pharmacy: string): ParsedPharmacyEmail {
    const medicationName = this.extractMedicationName(text);
    const prescriptionNumber = this.extractPrescriptionNumber(text);
    const confirmationNumber = this.extractConfirmationNumber(text);
    const readyDate = this.extractDate(text, ['ready', 'available', 'pickup']);
    const pickupLocation = this.extractPickupLocation(text);

    return {
      type: 'refill_ready',
      pharmacy,
      medicationName,
      prescriptionNumber,
      status: 'ready',
      actualReadyDate: readyDate || new Date(),
      pickupLocation,
      confirmationNumber,
      message: `Your prescription${medicationName ? ` for ${medicationName}` : ''} is ready for pickup${pickupLocation ? ` at ${pickupLocation}` : ''}.`,
      rawText: text
    };
  }

  /**
   * Parse a "refill processing" email
   */
  private parseRefillProcessingEmail(subject: string, text: string, pharmacy: string): ParsedPharmacyEmail {
    const medicationName = this.extractMedicationName(text);
    const prescriptionNumber = this.extractPrescriptionNumber(text);
    const confirmationNumber = this.extractConfirmationNumber(text);
    const estimatedDate = this.extractDate(text, ['ready', 'available', 'estimated', 'expect']);

    return {
      type: 'refill_processing',
      pharmacy,
      medicationName,
      prescriptionNumber,
      status: 'processing',
      estimatedReadyDate: estimatedDate,
      confirmationNumber,
      message: `Your prescription${medicationName ? ` for ${medicationName}` : ''} is being processed.`,
      rawText: text
    };
  }

  /**
   * Parse a "refill delayed" email
   */
  private parseRefillDelayedEmail(subject: string, text: string, pharmacy: string): ParsedPharmacyEmail {
    const medicationName = this.extractMedicationName(text);
    const prescriptionNumber = this.extractPrescriptionNumber(text);
    const estimatedDate = this.extractDate(text, ['ready', 'available', 'estimated', 'expect']);

    return {
      type: 'refill_delayed',
      pharmacy,
      medicationName,
      prescriptionNumber,
      status: 'delayed',
      estimatedReadyDate: estimatedDate,
      message: `Your prescription${medicationName ? ` for ${medicationName}` : ''} has been delayed.`,
      rawText: text
    };
  }

  /**
   * Parse a "refill cancelled" email
   */
  private parseRefillCancelledEmail(subject: string, text: string, pharmacy: string): ParsedPharmacyEmail {
    const medicationName = this.extractMedicationName(text);
    const prescriptionNumber = this.extractPrescriptionNumber(text);

    return {
      type: 'refill_cancelled',
      pharmacy,
      medicationName,
      prescriptionNumber,
      status: 'cancelled',
      message: `Your prescription${medicationName ? ` for ${medicationName}` : ''} has been cancelled.`,
      rawText: text
    };
  }

  /**
   * Parse a "refill reminder" email
   */
  private parseRefillReminderEmail(subject: string, text: string, pharmacy: string): ParsedPharmacyEmail {
    const medicationName = this.extractMedicationName(text);
    const prescriptionNumber = this.extractPrescriptionNumber(text);

    return {
      type: 'refill_reminder',
      pharmacy,
      medicationName,
      prescriptionNumber,
      status: 'pending',
      message: `Reminder: It's time to refill your prescription${medicationName ? ` for ${medicationName}` : ''}.`,
      rawText: text
    };
  }

  /**
   * Extract medication name from email text
   */
  private extractMedicationName(text: string): string | undefined {
    // Common patterns:
    // "Medication: [name]"
    // "Prescription: [name]"
    // "Rx: [name]"
    // "[Name] is ready"
    const patterns = [
      /(?:medication|prescription|drug|rx)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:is ready|ready for|available)/i,
      /for\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract prescription number from email text
   */
  private extractPrescriptionNumber(text: string): string | undefined {
    // Common patterns:
    // "Rx #: 12345"
    // "Prescription Number: 12345"
    // "RX12345"
    const patterns = [
      /(?:rx|prescription|rx\s*#)[\s:]*#?\s*([A-Z0-9-]+)/i,
      /(?:prescription\s*number|rx\s*number)[\s:]+([A-Z0-9-]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract confirmation number from email text
   */
  private extractConfirmationNumber(text: string): string | undefined {
    // Common patterns:
    // "Confirmation #: 12345"
    // "Order #: 12345"
    // "Ref #: 12345"
    const patterns = [
      /(?:confirmation|order|ref|reference)[\s:]*#?\s*([A-Z0-9-]+)/i
    ];

    for (const match of patterns.map(p => text.match(p)).filter(Boolean)) {
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract date from email text
   */
  private extractDate(text: string, keywords: string[]): Date | undefined {
    // Look for dates near keywords
    const datePatterns = [
      // "Ready on 01/15/2024"
      /(?:ready|available|estimated|expect).*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      // "January 15, 2024"
      /(?:ready|available|estimated|expect).*?([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
      // "2024-01-15"
      /(?:ready|available|estimated|expect).*?(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    // If no date found, try to find any date in the text
    const anyDatePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
    const anyMatch = text.match(anyDatePattern);
    if (anyMatch) {
      const date = new Date(anyMatch[1]);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    return undefined;
  }

  /**
   * Extract pickup location from email text
   */
  private extractPickupLocation(text: string): string | undefined {
    // Common patterns:
    // "Pickup at: [location]"
    // "Available at: [location]"
    // "Store: [location]"
    const patterns = [
      /(?:pickup|available|store)[\s:]+(?:at\s+)?([A-Z][^\.]+?)(?:\.|$)/i,
      /(?:location|store)[\s:]+([A-Z][^\.]+?)(?:\.|$)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}

export const pharmacyEmailParser = new PharmacyEmailParser();

