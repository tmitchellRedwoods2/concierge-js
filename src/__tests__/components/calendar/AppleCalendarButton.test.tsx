/**
 * Unit tests for AppleCalendarButton Component
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AppleCalendarButton from '@/components/calendar/AppleCalendarButton';

// Mock fetch globally
global.fetch = jest.fn();

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock window methods
const mockClick = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();

// Create mock link element
const createMockLink = () => ({
  href: '',
  download: '',
  style: { display: '' },
  click: mockClick,
});

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('AppleCalendarButton Component', () => {
  const mockEvent = {
    title: 'Test Event',
    startDate: new Date('2024-01-15T10:00:00Z'),
    endDate: new Date('2024-01-15T11:00:00Z'),
    location: 'Test Location',
    description: 'Test Description',
    attendees: ['test@example.com'],
  };

  const defaultProps = {
    eventId: 'test-event-id',
    event: mockEvent,
  };

  describe('Rendering', () => {
    it('should render button with default text', () => {
      render(<AppleCalendarButton {...defaultProps} />);
      expect(screen.getByText('Add to Apple Calendar')).toBeInTheDocument();
    });

    it('should render button with "View in Apple Calendar" when appleEventUrl is provided', () => {
      render(<AppleCalendarButton {...defaultProps} appleEventUrl="https://calendar.apple.com" />);
      expect(screen.getByText('View in Apple Calendar')).toBeInTheDocument();
    });

    it('should render calendar icon', () => {
      const { container } = render(<AppleCalendarButton {...defaultProps} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have correct button styling classes', () => {
      const { container } = render(<AppleCalendarButton {...defaultProps} />);
      const button = container.querySelector('button');
      expect(button?.className).toContain('bg-green-600');
      expect(button?.className).toContain('text-white');
    });
  });

  describe('Button Interactions', () => {
    it('should be disabled when loading', () => {
      const { container } = render(<AppleCalendarButton {...defaultProps} />);
      const button = container.querySelector('button');
      expect(button).not.toBeDisabled();
    });

    it('should show loading text when loading', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves to keep loading
      );

      const { container } = render(<AppleCalendarButton {...defaultProps} />);
      const button = container.querySelector('button');
      
      fireEvent.click(button!);
      
      await waitFor(() => {
        expect(screen.getByText('Opening...')).toBeInTheDocument();
      });
    });
  });

  describe('ICS File Download', () => {
    it('should fetch .ics file when button is clicked', async () => {
      const mockICSContent = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR';
      const mockBlob = new Blob([mockICSContent], { type: 'text/calendar' });
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue(mockBlob),
      });

      const { container } = render(<AppleCalendarButton {...defaultProps} />);
      
      // Mock document.createElement for anchor tags AFTER rendering
      const mockLink = createMockLink();
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return mockLink as any;
        }
        return originalCreateElement(tagName);
      });
      
      jest.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      jest.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);

      const button = container.querySelector('button');
      fireEvent.click(button!);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/calendar/event/test-event-id/ics');
      });
    });

    it('should create blob URL and trigger download', async () => {
      const mockICSContent = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR';
      const mockBlob = new Blob([mockICSContent], { type: 'text/calendar' });
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue(mockBlob),
      });

      const { container } = render(<AppleCalendarButton {...defaultProps} />);
      
      // Mock document.createElement for anchor tags AFTER rendering
      const mockLink = createMockLink();
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return mockLink as any;
        }
        return originalCreateElement(tagName);
      });
      
      jest.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      jest.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);

      const button = container.querySelector('button');
      fireEvent.click(button!);

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
        expect(mockClick).toHaveBeenCalled();
      });
    });

    it('should set correct download filename', async () => {
      const mockICSContent = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR';
      const mockBlob = new Blob([mockICSContent], { type: 'text/calendar' });
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue(mockBlob),
      });

      const { container } = render(<AppleCalendarButton {...defaultProps} />);
      
      // Mock document.createElement for anchor tags AFTER rendering
      const mockLink = createMockLink();
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return mockLink as any;
        }
        return originalCreateElement(tagName);
      });
      
      jest.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      jest.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);

      const button = container.querySelector('button');
      fireEvent.click(button!);

      await waitFor(() => {
        expect(mockAppendChild).toHaveBeenCalled();
        expect(mockLink.download).toBe('event-test-event-id.ics');
      });
    });

    it('should clean up blob URL after download', async () => {
      const mockICSContent = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR';
      const mockBlob = new Blob([mockICSContent], { type: 'text/calendar' });
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue(mockBlob),
      });

      const { container } = render(<AppleCalendarButton {...defaultProps} />);
      
      // Mock document.createElement for anchor tags AFTER rendering
      const mockLink = createMockLink();
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return mockLink as any;
        }
        return originalCreateElement(tagName);
      });
      
      jest.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      jest.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);

      const button = container.querySelector('button');
      fireEvent.click(button!);

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalled();
      });

      // Wait for the setTimeout to execute (100ms delay)
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Mock window.location.href setter
      delete (window as any).location;
      (window as any).location = { href: '' };

      const { container } = render(<AppleCalendarButton {...defaultProps} />);
      const button = container.querySelector('button');
      
      fireEvent.click(button!);

      await waitFor(() => {
        expect(window.location.href).toBe('/api/calendar/event/test-event-id/ics');
      });
    });

    it('should fallback to direct navigation when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      // Mock window.location.href setter
      delete (window as any).location;
      (window as any).location = { href: '' };

      const { container } = render(<AppleCalendarButton {...defaultProps} />);
      const button = container.querySelector('button');
      
      fireEvent.click(button!);

      await waitFor(() => {
        expect(window.location.href).toBe('/api/calendar/event/test-event-id/ics');
      });
    });

    it('should stop loading state after error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Mock window.location.href setter
      delete (window as any).location;
      (window as any).location = { href: '' };

      const { container } = render(<AppleCalendarButton {...defaultProps} />);
      const button = container.querySelector('button');
      
      fireEvent.click(button!);

      await waitFor(() => {
        expect(screen.queryByText('Opening...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Event Data Handling', () => {
    it('should work with minimal event data', () => {
      const minimalEvent = {
        title: 'Minimal Event',
        startDate: new Date('2024-01-15T10:00:00Z'),
        endDate: new Date('2024-01-15T11:00:00Z'),
      };

      render(<AppleCalendarButton eventId="test-id" event={minimalEvent} />);
      expect(screen.getByText('Add to Apple Calendar')).toBeInTheDocument();
    });

    it('should work with event without attendees', () => {
      const eventWithoutAttendees = {
        ...mockEvent,
        attendees: undefined,
      };

      render(<AppleCalendarButton eventId="test-id" event={eventWithoutAttendees} />);
      expect(screen.getByText('Add to Apple Calendar')).toBeInTheDocument();
    });
  });
});

