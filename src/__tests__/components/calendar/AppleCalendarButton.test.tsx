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
  target: '',
  style: { display: '' },
  click: mockClick,
});

// Create mock iframe element
const createMockIframe = () => ({
  src: '',
  style: { display: '' },
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
    beforeEach(() => {
      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:3000',
        },
        writable: true,
      });
    });

    it('should fetch .ics file when button is clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('text/calendar'),
        },
      });

      const { container } = render(<AppleCalendarButton {...defaultProps} />);
      
      // Set up mocks AFTER rendering
      const mockIframe = createMockIframe();
      const mockLink = createMockLink();
      
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'iframe') {
          return mockIframe as any;
        }
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
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/calendar/event/test-event-id/ics',
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Accept': 'text/calendar, */*',
            }),
          })
        );
      });
    });

    it('should create iframe and link elements on successful fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('text/calendar'),
        },
      });

      const { container } = render(<AppleCalendarButton {...defaultProps} />);
      
      // Set up mocks AFTER rendering
      const mockIframe = createMockIframe();
      const mockLink = createMockLink();
      
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'iframe') {
          return mockIframe as any;
        }
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
        expect(document.createElement).toHaveBeenCalledWith('iframe');
        expect(document.createElement).toHaveBeenCalledWith('a');
        expect(mockIframe.src).toBe('http://localhost:3000/api/calendar/event/test-event-id/ics');
        expect(mockLink.href).toBe('http://localhost:3000/api/calendar/event/test-event-id/ics');
        expect(mockLink.download).toBe('event-test-event-id.ics');
        expect(mockClick).toHaveBeenCalled();
      });
    });

    it('should set correct download filename', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('text/calendar'),
        },
      });

      const { container } = render(<AppleCalendarButton {...defaultProps} />);
      
      // Set up mocks AFTER rendering
      const mockIframe = createMockIframe();
      const mockLink = createMockLink();
      
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'iframe') {
          return mockIframe as any;
        }
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
        expect(mockLink.download).toBe('event-test-event-id.ics');
        expect(mockLink.target).toBe('_blank');
      });
    });

    it('should clean up iframe and link after download', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('text/calendar'),
        },
      });

      const { container } = render(<AppleCalendarButton {...defaultProps} />);
      
      // Set up mocks AFTER rendering
      const mockIframe = createMockIframe();
      const mockLink = createMockLink();
      
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'iframe') {
          return mockIframe as any;
        }
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
        expect(mockAppendChild).toHaveBeenCalledTimes(2); // iframe and link
      });

      // Wait for the setTimeout to execute (100ms for link, 2000ms for iframe)
      await new Promise(resolve => setTimeout(resolve, 150));

      // Link should be removed after 100ms
      expect(mockRemoveChild).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:3000',
        },
        writable: true,
      });
    });

    it('should handle fetch errors gracefully and show fallback UI', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { container } = render(<AppleCalendarButton {...defaultProps} />);
      const button = container.querySelector('button');
      
      fireEvent.click(button!);

      await waitFor(() => {
        // Should show fallback UI with download link
        expect(screen.getByText('Download .ics File')).toBeInTheDocument();
        expect(screen.queryByText('Opening...')).not.toBeInTheDocument();
      });
    });

    it('should fallback to direct link when fetch fails with non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      const { container } = render(<AppleCalendarButton {...defaultProps} />);
      const button = container.querySelector('button');
      
      fireEvent.click(button!);

      await waitFor(() => {
        // Should show fallback UI
        expect(screen.getByText('Download .ics File')).toBeInTheDocument();
        expect(screen.queryByText('Opening...')).not.toBeInTheDocument();
      });
    });

    it('should stop loading state after error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

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

