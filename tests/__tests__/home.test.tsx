import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />);
    
    const heading = screen.getByRole('heading', {
      name: /concierge\.com/i,
    });
    
    expect(heading).toBeDefined();
  });

  it('renders the sign up button', () => {
    render(<Home />);
    
    const signUpButton = screen.getByRole('link', {
      name: /sign up/i,
    });
    
    expect(signUpButton).toBeDefined();
  });

  it('renders the sign in button', () => {
    render(<Home />);
    
    const signInButton = screen.getByRole('link', {
      name: /sign in/i,
    });
    
    expect(signInButton).toBeDefined();
  });
});
