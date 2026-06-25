import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import RecipeDetailModal from '../components/RecipeDetailModal';
import type { RecipeSummary } from '../services/recipeSearchService';

const baseRecipe: RecipeSummary = {
  title: 'Creamy Pesto Pasta',
  cookpadUrl: 'https://cookpad.com/recipe-1',
  imageUrl: 'https://images.example.com/pasta.jpg',
  description: 'A quick pasta dinner with pesto and cream.',
  ingredients: ['Pasta', 'Pesto', 'Cream'],
};

function ModalHarness({
  recipe,
  startOpen = true,
}: {
  recipe: RecipeSummary | null;
  startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open modal</button>
      <RecipeDetailModal recipe={recipe} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

describe('RecipeDetailModal', () => {
  it('does not render a dialog when recipe is null', () => {
    render(<ModalHarness recipe={null} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders an accessible dialog with the recipe title when open', () => {
    render(<ModalHarness recipe={baseRecipe} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Creamy Pesto Pasta' })).toBeInTheDocument();
  });

  it('uses a light modal surface and matching green accents for app-owned controls', () => {
    render(<ModalHarness recipe={baseRecipe} />);

    const dialog = screen.getByRole('dialog');
    const dialogTitle = screen.getByRole('heading', { name: 'Creamy Pesto Pasta' }).parentElement;
    const closeButton = screen.getByRole('button', { name: 'Close' });

    expect(getComputedStyle(dialog).backgroundColor).toBe('rgb(255, 255, 255)');
    expect(dialogTitle).not.toBeNull();
    expect(getComputedStyle(dialogTitle!).borderBottomColor).toBe('rgba(127, 168, 73, 0.18)');
    expect(getComputedStyle(closeButton).color).toBe('rgb(72, 96, 72)');
  });

  it('renders the recipe image when imageUrl is available', () => {
    render(<ModalHarness recipe={baseRecipe} />);

    const image = screen.getByRole('img', { name: 'Creamy Pesto Pasta' });

    expect(image).toHaveAttribute('src', 'https://images.example.com/pasta.jpg');
  });

  it('renders no img element when imageUrl is null', () => {
    const noImageRecipe: RecipeSummary = { ...baseRecipe, imageUrl: null };

    render(<ModalHarness recipe={noImageRecipe} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders the full recipe description', () => {
    render(<ModalHarness recipe={baseRecipe} />);

    expect(screen.getByText('A quick pasta dinner with pesto and cream.')).toBeInTheDocument();
  });

  it('shows fallback description text when description is null', () => {
    const noDescriptionRecipe: RecipeSummary = { ...baseRecipe, description: null };

    render(<ModalHarness recipe={noDescriptionRecipe} />);

    expect(screen.getByText('Description coming soon.')).toBeInTheDocument();
  });

  it('renders all ingredients', () => {
    render(<ModalHarness recipe={baseRecipe} />);

    expect(screen.getByText('Pasta')).toBeInTheDocument();
    expect(screen.getByText('Pesto')).toBeInTheDocument();
    expect(screen.getByText('Cream')).toBeInTheDocument();
  });

  it('shows "Ingredients coming soon." when the ingredients list is empty', () => {
    const noIngredientsRecipe: RecipeSummary = { ...baseRecipe, ingredients: [] };

    render(<ModalHarness recipe={noIngredientsRecipe} />);

    expect(screen.getByText('Ingredients coming soon.')).toBeInTheDocument();
  });

  it('renders the exact placeholder method text', () => {
    render(<ModalHarness recipe={baseRecipe} />);

    expect(screen.getByText('We will soon add method steps here')).toBeInTheDocument();
  });

  it('has an accessible close button', () => {
    render(<ModalHarness recipe={baseRecipe} />);

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('closes the modal when the close button is clicked', async () => {
    const user = userEvent.setup();

    render(<ModalHarness recipe={baseRecipe} />);

    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes the modal when Escape is pressed', async () => {
    const user = userEvent.setup();

    render(<ModalHarness recipe={baseRecipe} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('moves keyboard focus into the modal when it opens', async () => {
    const user = userEvent.setup();

    render(<ModalHarness recipe={baseRecipe} startOpen={false} />);

    await user.click(screen.getByRole('button', { name: 'Open modal' }));

    const dialog = await screen.findByRole('dialog');

    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('keeps focus within the modal while it is open', async () => {
    const user = userEvent.setup();

    render(<ModalHarness recipe={baseRecipe} />);

    const dialog = screen.getByRole('dialog');

    await user.tab();

    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.tab();

    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('restores focus to the trigger element when the modal closes via Escape', async () => {
    const user = userEvent.setup();

    render(<ModalHarness recipe={baseRecipe} startOpen={false} />);

    const openButton = screen.getByRole('button', { name: 'Open modal' });

    await user.click(openButton);
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(document.activeElement).toBe(openButton);
    });
  });

  it('restores focus to the trigger element when the modal closes via the close button', async () => {
    const user = userEvent.setup();

    render(<ModalHarness recipe={baseRecipe} startOpen={false} />);

    const openButton = screen.getByRole('button', { name: 'Open modal' });

    await user.click(openButton);
    await screen.findByRole('dialog');

    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(document.activeElement).toBe(openButton);
    });
  });
});
