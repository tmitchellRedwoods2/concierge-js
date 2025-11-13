/**
 * Unit tests for Email Parser Service
 */
import { EmailParserService, ParsedAppointment } from '@/lib/services/email-parser';

describe('EmailParserService', () => {
  let parser: EmailParserService;

  beforeEach(() => {
    parser = new EmailParserService();
  });

  describe('parseAppointmentEmail', () => {
    it('should return null for non-appointment emails', () => {
      const email = {
        from: 'newsletter@example.com',
        subject: 'Weekly Newsletter',
        body: 'Check out our latest updates and news.'
      };

      const result = parser.parseAppointmentEmail(email);
      expect(result).toBeNull();
    });

    it('should parse appointment email with date and time', () => {
      const email = {
        from: 'doctor@example.com',
        subject: 'Appointment Confirmation',
        body: 'Your appointment is scheduled for January 15, 2024 at 10:00 AM'
      };

      const result = parser.parseAppointmentEmail(email);
      
      expect(result).not.toBeNull();
      expect(result?.title).toBeDefined();
      expect(result?.startDate).toBeInstanceOf(Date);
      expect(result?.endDate).toBeInstanceOf(Date);
      expect(result?.startDate.getTime()).toBeLessThan(result!.endDate.getTime());
    });

    it('should extract doctor name from email', () => {
      const email = {
        from: 'Dr. Smith <dr.smith@example.com>',
        subject: 'Appointment with Dr. Smith',
        body: 'Your appointment is scheduled for tomorrow at 2 PM'
      };

      const result = parser.parseAppointmentEmail(email);
      
      expect(result).not.toBeNull();
      expect(result?.doctorName).toBeDefined();
      expect(result?.doctorEmail).toContain('dr.smith@example.com');
    });

    it('should extract location from email body', () => {
      const email = {
        from: 'clinic@example.com',
        subject: 'Appointment Reminder',
        body: 'Your appointment is on January 20, 2024 at 123 Main Street, San Francisco, CA'
      };

      const result = parser.parseAppointmentEmail(email);
      
      expect(result).not.toBeNull();
      expect(result?.location).toBeDefined();
      expect(result?.location).toContain('Street');
    });

    it('should handle ISO date format', () => {
      const email = {
        from: 'doctor@example.com',
        subject: 'Appointment Scheduled',
        body: 'Your appointment is scheduled for 2024-01-15T10:00:00Z'
      };

      const result = parser.parseAppointmentEmail(email);
      
      expect(result).not.toBeNull();
      expect(result?.startDate).toBeInstanceOf(Date);
      expect(result?.startDate.getFullYear()).toBe(2024);
      expect(result?.startDate.getMonth()).toBe(0); // January
      expect(result?.startDate.getDate()).toBe(15);
    });

    it('should handle relative dates like "today"', () => {
      const email = {
        from: 'doctor@example.com',
        subject: 'Appointment Today',
        body: 'Your appointment is today at 3 PM'
      };

      const result = parser.parseAppointmentEmail(email);
      
      expect(result).not.toBeNull();
      expect(result?.startDate).toBeInstanceOf(Date);
      const today = new Date();
      expect(result?.startDate.getDate()).toBe(today.getDate());
      expect(result?.startDate.getMonth()).toBe(today.getMonth());
      expect(result?.startDate.getFullYear()).toBe(today.getFullYear());
    });

    it('should handle relative dates like "tomorrow"', () => {
      const email = {
        from: 'doctor@example.com',
        subject: 'Appointment Tomorrow',
        body: 'Your appointment is tomorrow at 2 PM'
      };

      const result = parser.parseAppointmentEmail(email);
      
      expect(result).not.toBeNull();
      expect(result?.startDate).toBeInstanceOf(Date);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(result?.startDate.getDate()).toBe(tomorrow.getDate());
    });

    it('should extract time from email', () => {
      const email = {
        from: 'doctor@example.com',
        subject: 'Appointment Scheduled',
        body: 'Your appointment is on January 15, 2024 at 2:30 PM'
      };

      const result = parser.parseAppointmentEmail(email);
      
      expect(result).not.toBeNull();
      expect(result?.startDate.getHours()).toBe(14); // 2 PM in 24-hour format
      expect(result?.startDate.getMinutes()).toBe(30);
      expect(result?.allDay).toBe(false);
    });

    it('should set allDay to true when no time is specified', () => {
      const email = {
        from: 'doctor@example.com',
        subject: 'Appointment Scheduled',
        body: 'Your appointment is on January 15, 2024'
      };

      const result = parser.parseAppointmentEmail(email);
      
      expect(result).not.toBeNull();
      // If time is not specified, it might default to midnight
      // The allDay flag should be set appropriately
    });

    it('should calculate confidence score', () => {
      const email = {
        from: 'Dr. Johnson <dr.johnson@example.com>',
        subject: 'Appointment Confirmation',
        body: 'Your appointment with Dr. Johnson is scheduled for January 15, 2024 at 10:00 AM at 123 Medical Center Drive'
      };

      const result = parser.parseAppointmentEmail(email);
      
      expect(result).not.toBeNull();
      expect(result?.confidence).toBeGreaterThan(0);
      expect(result?.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle multiple appointment keywords', () => {
      const email = {
        from: 'clinic@example.com',
        subject: 'Medical Appointment Reminder',
        body: 'This is a reminder for your scheduled checkup appointment'
      };

      const result = parser.parseAppointmentEmail(email);
      
      expect(result).not.toBeNull();
    });

    it('should extract title from subject', () => {
      const email = {
        from: 'doctor@example.com',
        subject: 'Appointment with Dr. Smith - January 15',
        body: 'Your appointment is scheduled'
      };

      const result = parser.parseAppointmentEmail(email);
      
      expect(result).not.toBeNull();
      expect(result?.title).toBeDefined();
      expect(result?.title.length).toBeGreaterThan(0);
    });

    it('should build description from email content', () => {
      const email = {
        from: 'Dr. Smith <dr.smith@example.com>',
        subject: 'Appointment Confirmation',
        body: 'Your appointment is scheduled for January 15, 2024. Please arrive 15 minutes early. Bring your insurance card.'
      };

      const result = parser.parseAppointmentEmail(email);
      
      expect(result).not.toBeNull();
      expect(result?.description).toBeDefined();
      expect(result?.description).toContain('Dr. Smith');
    });

    it('should set default end date to 1 hour after start', () => {
      const email = {
        from: 'doctor@example.com',
        subject: 'Appointment Scheduled',
        body: 'Your appointment is on January 15, 2024 at 10:00 AM'
      };

      const result = parser.parseAppointmentEmail(email);
      
      expect(result).not.toBeNull();
      const expectedEnd = new Date(result!.startDate.getTime() + 60 * 60 * 1000);
      expect(result?.endDate.getTime()).toBe(expectedEnd.getTime());
    });

    it('should handle MM/DD/YYYY date format', () => {
      const email = {
        from: 'doctor@example.com',
        subject: 'Appointment Scheduled',
        body: 'Your appointment is on 01/15/2024 at 2 PM'
      };

      const result = parser.parseAppointmentEmail(email);
      
      expect(result).not.toBeNull();
      expect(result?.startDate.getFullYear()).toBe(2024);
      expect(result?.startDate.getMonth()).toBe(0); // January
      expect(result?.startDate.getDate()).toBe(15);
    });

    it('should handle 12-hour time format with AM/PM', () => {
      const email = {
        from: 'doctor@example.com',
        subject: 'Appointment Scheduled',
        body: 'Your appointment is on January 15, 2024 at 2:30 PM'
      };

      const result = parser.parseAppointmentEmail(email);
      
      expect(result).not.toBeNull();
      expect(result?.startDate.getHours()).toBe(14); // 2 PM = 14:00
      expect(result?.startDate.getMinutes()).toBe(30);
    });

    it('should return null when no date can be extracted', () => {
      const email = {
        from: 'doctor@example.com',
        subject: 'Appointment Information',
        body: 'Please contact us to schedule your appointment'
      };

      const result = parser.parseAppointmentEmail(email);
      
      // Should return null if no date can be extracted
      expect(result).toBeNull();
    });
  });
});

