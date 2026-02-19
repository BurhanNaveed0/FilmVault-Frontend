import { render, screen } from '@testing-library/react';
import App from './App';

test('renders FilmVault branding and nav links', () => {
  render(<App />);
  expect(screen.getByText(/FilmVault/i)).toBeInTheDocument();
  expect(screen.getByText(/Home/i)).toBeInTheDocument();
  expect(screen.getByText(/Films/i)).toBeInTheDocument();
  expect(screen.getByText(/Customers/i)).toBeInTheDocument();
});
