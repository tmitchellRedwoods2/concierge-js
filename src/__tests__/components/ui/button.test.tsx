/**
 * Component Tests - Button
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button with text', () => {
      render(<Button>Click Me</Button>);
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('should render button with default variant', () => {
      const { container } = render(<Button>Default</Button>);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<Button className="custom-class">Test</Button>);
      const button = container.querySelector('button');
      expect(button?.className).toContain('custom-class');
    });
  });

  describe('Variants', () => {
    it('should render with default variant', () => {
      render(<Button variant="default">Default</Button>);
      expect(screen.getByText('Default')).toBeInTheDocument();
    });

    it('should render with outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      expect(screen.getByText('Outline')).toBeInTheDocument();
    });

    it('should render with ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByText('Ghost')).toBeInTheDocument();
    });

    it('should render with destructive variant', () => {
      render(<Button variant="destructive">Destructive</Button>);
      expect(screen.getByText('Destructive')).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should render with default size', () => {
      render(<Button size="default">Default Size</Button>);
      expect(screen.getByText('Default Size')).toBeInTheDocument();
    });

    it('should render with sm size', () => {
      render(<Button size="sm">Small</Button>);
      expect(screen.getByText('Small')).toBeInTheDocument();
    });

    it('should render with lg size', () => {
      render(<Button size="lg">Large</Button>);
      expect(screen.getByText('Large')).toBeInTheDocument();
    });

    it('should render with icon size', () => {
      render(<Button size="icon">🔍</Button>);
      expect(screen.getByText('🔍')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClick handler when clicked', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      
      const button = screen.getByText('Click Me');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      
      const button = screen.getByText('Disabled');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should have disabled attribute when disabled prop is true', () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      const button = container.querySelector('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Children Content', () => {
    it('should render with icon and text', () => {
      render(
        <Button>
          <span>🔍</span>
          <span>Search</span>
        </Button>
      );
      
      expect(screen.getByText('🔍')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
    });

    it('should render with only icon', () => {
      render(<Button>🔍</Button>);
      expect(screen.getByText('🔍')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Accessible</Button>);
      
      const button = screen.getByText('Accessible');
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('should have button role', () => {
      const { container } = render(<Button>Test</Button>);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(button?.tagName.toLowerCase()).toBe('button');
    });
  });
});

