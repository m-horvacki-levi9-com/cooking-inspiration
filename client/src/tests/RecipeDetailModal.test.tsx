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
  startOpen = true,
}: {
  recipe: RecipeSearchListItem | null;
  recipeDetails: RecipeDetails | null;
  startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open modal</button>
      <RecipeDetailModal
        recipe={recipe}
        recipeDetails={recipeDetails}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

describe('RecipeDetailModal', () => {
  it('GivenNullRecipe_WhenRenderingModal_ThenDoesNotRenderDialog', () => {
    // Arrange

    // Act
    render(<ModalHarness recipe={null} recipeDetails={null} />);

    // Assert
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('GivenRecipeDetailsAreAvailable_WhenRenderingModal_ThenRendersIngredientsAndOrderedMethodSteps', () => {
    // Arrange

    // Act
    render(
      <ModalHarness recipe={compactRecipe} recipeDetails={detailRecipe} />,
    );

    // Assert
    expect(screen.getByText('Pasta')).toBeInTheDocument();
    expect(screen.getByText('Pesto')).toBeInTheDocument();
    expect(
      screen.getByRole('list', { name: 'Method steps' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Boil pasta.')).toBeInTheDocument();
    expect(screen.getByText('Stir in pesto.')).toBeInTheDocument();
  });

  it('GivenRecipeDetailsWithoutMethodSteps_WhenRenderingModal_ThenShowsMethodFallbackMessage', () => {
    // Arrange

    // Act
    render(
      <ModalHarness
        recipe={compactRecipe}
        recipeDetails={{ ...detailRecipe, methodSteps: [] }}
      />,
    );

    // Assert
    expect(
      screen.getByText('Method steps are unavailable for this recipe.'),
    ).toBeInTheDocument();
  });

  it('GivenRecipeModalIsRendered_WhenInspectingActions_ThenDoesNotRenderViewRecipeAction', () => {
    // Arrange

    // Act
    render(
      <ModalHarness recipe={compactRecipe} recipeDetails={detailRecipe} />,
    );

    // Assert
    expect(
      screen.queryByRole('link', { name: 'View recipe' }),
    ).not.toBeInTheDocument();
  });

  it('GivenOpenRecipeModal_WhenCloseButtonIsClicked_ThenClosesModal', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    render(
      <ModalHarness recipe={compactRecipe} recipeDetails={detailRecipe} />,
    );

    await user.click(screen.getByRole('button', { name: 'Close' }));

    // Assert
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
