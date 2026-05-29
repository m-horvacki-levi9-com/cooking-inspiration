import { render, screen } from '@testing-library/react';

import App from '../App';

describe('App', () => {
  it('renders the application shell with placeholder content', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Cooking Inspiration' })).toBeInTheDocument();
    expect(screen.getByText('Fresh ideas for meals, planning, and shopping are coming soon.')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Recipe discovery, shopping support, and localization will be added in future tickets.');
  });
});
