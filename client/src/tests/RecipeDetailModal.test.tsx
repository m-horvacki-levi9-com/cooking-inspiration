import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import RecipeDetailModal from '../components/RecipeDetailModal';
import type { RecipeDetails } from '../services/recipeDetailsService';
import type { RecipeSearchListItem } from '../services/recipeSearchService';

const compactRecipe: RecipeSearchListItem = {
  recipeId: '11111',
  title: 'Creamy Pesto Pasta',
  cookpadUrl: 'https://cookpad.com/recipe-1',
  imageUrl: 'https://images.example.com/pasta.jpg',
  description: 'A quick pasta dinner with pesto and cream.',
};

const detailRecipe: RecipeDetails = {
  recipeId: '11111',
  title: 'Creamy Pesto Pasta',
  cookpadUrl: 'https://cookpad.com/eng/recipes/11111',
  imageUrl: 'https://images.example.com/pasta.jpg',
  description: 'A quick pasta dinner with pesto and cream.',
  ingredients: ['Pasta', 'Pesto', 'Cream'],
  methodSteps: ['Boil pasta.', 'Stir in pesto.'],
};

function ModalHarness({
  recipe,
  recipeDetails,
  detailsStatus = 'success',
  startOpen = true,
}: {
  recipe: RecipeSearchListItem | null;
  recipeDetails: RecipeDetails | null;
  detailsStatus?: 'idle' | 'loading' | 'success' | 'error';
  startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open modal</button>
      <RecipeDetailModal
        recipe={recipe}
        recipeDetails={recipeDetails}
        detailsStatus={detailsStatus}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

describe('RecipeDetailModal', () => {
  it('does not render a dialog when recipe is null', () => {
    render(<ModalHarness recipe={null} recipeDetails={null} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows loading messaging while details are being lazy-loaded', () => {
    render(<ModalHarness recipe={compactRecipe} recipeDetails={null} detailsStatus="loading" />);

    expect(screen.getByText('Loading ingredients…')).toBeInTheDocument();
    expect(screen.getByText('Loading method steps…')).toBeInTheDocument();
  });

  it('renders ingredients and ordered method steps when detail data is available', () => {
    render(<ModalHarness recipe={compactRecipe} recipeDetails={detailRecipe} detailsStatus="success" />);

    expect(screen.getByText('Pasta')).toBeInTheDocument();
    expect(screen.getByText('Pesto')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Method steps' })).toBeInTheDocument();
    expect(screen.getByText('Boil pasta.')).toBeInTheDocument();
    expect(screen.getByText('Stir in pesto.')).toBeInTheDocument();
  });

  it('shows method fallback when no method steps are available', () => {
    render(
      <ModalHarness
        recipe={compactRecipe}
        recipeDetails={{ ...detailRecipe, methodSteps: [] }}
        detailsStatus="success"
      />,
    );

    expect(screen.getByText('Method steps are unavailable for this recipe.')).toBeInTheDocument();
  });

  it('uses canonical detail URL for the recipe action link', () => {
    render(<ModalHarness recipe={compactRecipe} recipeDetails={detailRecipe} detailsStatus="success" />);

    const link = screen.getByRole('link', { name: 'View recipe' });

    expect(link).toHaveAttribute('href', 'https://cookpad.com/eng/recipes/11111');
  });

  it('closes the modal when the close button is clicked', async () => {
    const user = userEvent.setup();

    render(<ModalHarness recipe={compactRecipe} recipeDetails={detailRecipe} detailsStatus="success" />);

    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
