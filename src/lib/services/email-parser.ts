/**
 * Email Parser Service
 * Extracts appointment details from email content
 */

export interface ParsedAppointment {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  description?: string;
  doctorName?: string;
  doctorEmail?: string;
  attendees?: string[];
  allDay?: boolean;
  confidence: number; // 0-1, how confident we are in the extraction
}

export class EmailParserService {
  /**
   * Parse appointment details from email content
   */
  parseAppointmentEmail(email: {
    from: string;
    subject: string;
    body: string;
  }): ParsedAppointment | null {
    const text = `${email.subject} ${email.body}`.toLowerCase();
    
    // Check if this looks like an appointment email
    const appointmentKeywords = [
      'appointment', 'schedule', 'scheduled', 'visit', 'checkup',
      'physical', 'exam', 'consultation', 'meeting', 'follow-up',
      'follow up', 'reminder', 'confirm', 'confirmation'
    ];
    
    const hasAppointmentKeyword = appointmentKeywords.some(keyword => 
      text.includes(keyword)
    );
    
    if (!hasAppointmentKeyword) {
      return null;
    }

    // Extract date and time
    const dateTime = this.extractDateTime(email.subject, email.body);
    if (!dateTime.startDate) {
      console.log('⚠️ Could not extract date from email');
      return null;
    }

    // Extract doctor/provider name
    const doctorName = this.extractDoctorName(email.from, email.subject, email.body);
    
    // Extract location
    const location = this.extractLocation(email.body);
    
    // Extract title
    const title = this.extractTitle(email.subject, email.body, doctorName);
    
    // Calculate end date (default to 1 hour after start)
    const endDate = dateTime.endDate || new Date(dateTime.startDate.getTime() + 60 * 60 * 1000);
    
    // Extract description
    const description = this.buildDescription(email.body, doctorName, location);
    
    // Calculate confidence based on how much we extracted
    const confidence = this.calculateConfidence({
      hasDate: !!dateTime.startDate,
      hasDoctor: !!doctorName,
      hasLocation: !!location,
      hasTime: !!dateTime.startDate && dateTime.startDate.getHours() !== 0
    });

    return {
      title,
      startDate: dateTime.startDate,
      endDate,
      location,
      description,
      doctorName,
      doctorEmail: email.from,
      attendees: [email.from],
      allDay: !dateTime.startDate || dateTime.startDate.getHours() === 0,
      confidence
    };
  }

  /**
   * Extract date and time from text
   */
  private extractDateTime(subject: string, body: string): { startDate: Date | null; endDate: Date | null } {
    const text = `${subject} ${body}`;
    const now = new Date();
    
    // Try various date patterns
    const datePatterns = [
      // MM/DD/YYYY or MM-DD-YYYY
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,
      // Month DD, YYYY
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})/gi,
      // DD Month YYYY
      /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/gi,
      // Today, Tomorrow, Next Week, etc.
      /(today|tomorrow|next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|week))/gi
    ];

    let bestMatch: Date | null = null;
    let bestEndDate: Date | null = null;

    // Try ISO dates first
    const isoMatch = text.match(/\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?/);
    if (isoMatch) {
      bestMatch = new Date(isoMatch[0]);
      if (bestMatch.getTime() > now.getTime()) {
        bestEndDate = new Date(bestMatch.getTime() + 60 * 60 * 1000);
        return { startDate: bestMatch, endDate: bestEndDate };
      }
    }

    // Try relative dates
    if (text.includes('today')) {
      bestMatch = new Date(now);
      bestMatch.setHours(9, 0, 0, 0); // Default to 9 AM
    } else if (text.includes('tomorrow')) {
      bestMatch = new Date(now);
      bestMatch.setDate(bestMatch.getDate() + 1);
      bestMatch.setHours(9, 0, 0, 0);
    } else if (text.includes('next week')) {
      bestMatch = new Date(now);
      bestMatch.setDate(bestMatch.getDate() + 7);
      bestMatch.setHours(9, 0, 0, 0);
    }

    // Try to extract time
    const timePattern = /(\d{1,2}):(\d{2})\s*(am|pm)?/gi;
    const timeMatch = text.match(timePattern);
    if (timeMatch && bestMatch) {
      const timeStr = timeMatch[0];
      const [hours, minutes] = timeStr.split(':').map(Number);
      const isPM = timeStr.toLowerCase().includes('pm');
      let hour24 = hours;
      if (isPM && hours !== 12) hour24 = hours + 12;
      if (!isPM && hours === 12) hour24 = 0;
      bestMatch.setHours(hour24, minutes || 0, 0, 0);
    }

    // Try standard date formats
    for (const pattern of datePatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        try {
          let date: Date;
          if (match[0].includes('january') || match[0].includes('february')) {
            // Month name format
            date = new Date(match[0]);
          } else {
            // Numeric format
            const parts = match[0].split(/[\/\-]/);
            if (parts.length === 3) {
              const month = parseInt(parts[0]) - 1;
              const day = parseInt(parts[1]);
              const year = parseInt(parts[2]);
              date = new Date(year, month, day);
            } else {
              continue;
            }
          }
          
          if (date.getTime() > now.getTime() && (!bestMatch || date.getTime() < bestMatch.getTime())) {
            bestMatch = date;
            // Set default time if not already set
            if (bestMatch.getHours() === 0 && bestMatch.getMinutes() === 0) {
              bestMatch.setHours(9, 0, 0, 0);
            }
            bestEndDate = new Date(bestMatch.getTime() + 60 * 60 * 1000);
          }
        } catch (e) {
          // Invalid date, continue
        }
      }
    }

    return { startDate: bestMatch, endDate: bestEndDate };
  }

  /**
   * Extract doctor/provider name
   */
  private extractDoctorName(from: string, subject: string, body: string): string | undefined {
    // Try to extract from "from" field
    const fromMatch = from.match(/([^<@]+)/);
    if (fromMatch) {
      const name = fromMatch[1].trim();
      if (name && name.length > 2 && name.length < 50) {
        return name;
      }
    }

    // Try common patterns in subject/body
    const patterns = [
      /dr\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
      /doctor\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
      /with\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
    ];

    for (const pattern of patterns) {
      const match = `${subject} ${body}`.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract location/address
   */
  private extractLocation(body: string): string | undefined {
    // Look for address patterns
    const addressPatterns = [
      /\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(Medical|Clinic|Hospital|Center|Office)/i
    ];

    for (const pattern of addressPatterns) {
      const match = body.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract or generate title
   */
  private extractTitle(subject: string, body: string, doctorName?: string): string {
    // Clean up subject
    let title = subject
      .replace(/^(re:|fwd?:|fw:)\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    // If subject is too long or generic, create a better title
    if (title.length > 60 || title.toLowerCase().includes('appointment')) {
      if (doctorName) {
        title = `Appointment with ${doctorName}`;
      } else {
        title = 'Medical Appointment';
      }
    }

    return title;
  }

  /**
   * Build description from email content
   */
  private buildDescription(body: string, doctorName?: string, location?: string): string {
    const parts: string[] = [];
    
    if (doctorName) {
      parts.push(`Doctor: ${doctorName}`);
    }
    
    if (location) {
      parts.push(`Location: ${location}`);
    }
    
    // Add first few sentences of email body
    const sentences = body.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 0) {
      parts.push(sentences.slice(0, 2).join('. ').trim());
    }
    
    return parts.join('\n\n');
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(extracted: {
    hasDate: boolean;
    hasDoctor: boolean;
    hasLocation: boolean;
    hasTime: boolean;
  }): number {
    let score = 0;
    
    if (extracted.hasDate) score += 0.4;
    if (extracted.hasTime) score += 0.2;
    if (extracted.hasDoctor) score += 0.2;
    if (extracted.hasLocation) score += 0.2;
    
    return Math.min(score, 1.0);
  }
}

// Singleton instance
export const emailParserService = new EmailParserService();

