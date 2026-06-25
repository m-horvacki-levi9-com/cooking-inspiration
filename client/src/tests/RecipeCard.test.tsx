import { render, screen } from '@testing-library/react';

import RecipeCard from '../components/RecipeCard';
import type { RecipeDetails } from '../services/recipeDetailsService';

const baseRecipe: RecipeDetails = {
  recipeId: '11111',
  title: 'Creamy Pesto Pasta',
  cookpadUrl: 'https://cookpad.com/recipe-1',
  imageUrl: 'https://images.example.com/pasta.jpg',
  description: 'A quick pasta dinner with pesto and cream.',
  ingredients: ['Pasta', 'Pesto', 'Cream'],
  methodSteps: ['Boil pasta.', 'Mix sauce.'],
};

const renderBringWidget = vi.fn();

describe('RecipeCard', () => {
  beforeEach(() => {
    renderBringWidget.mockReset();
    window.bringwidgets = {
      import: {
        render: renderBringWidget,
      },
    };
  });

  it('renders the recipe title, description, and ingredients', () => {
    render(<RecipeCard recipe={baseRecipe} />);

    expect(screen.getByRole('heading', { level: 3, name: 'Creamy Pesto Pasta' })).toBeInTheDocument();
    expect(screen.getByText('A quick pasta dinner with pesto and cream.')).toBeInTheDocument();
    expect(screen.getByText('Pasta')).toBeInTheDocument();
    expect(screen.getByText('Pesto')).toBeInTheDocument();
    expect(screen.getByText('Cream')).toBeInTheDocument();
  });

  it('renders a "View recipe" link pointing to the recipe URL', () => {
    render(<RecipeCard recipe={baseRecipe} />);

    const link = screen.getByRole('link', { name: 'View recipe' });

    expect(link).toHaveAttribute('href', 'https://cookpad.com/recipe-1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  it('shows an "Import to Bring!" link when the recipe has a URL', () => {
    render(<RecipeCard recipe={baseRecipe} />);

    const bringLink = screen.getByRole('link', { name: 'Import to Bring!' });

    expect(bringLink).toBeInTheDocument();
    expect(bringLink).toHaveAttribute('href', 'https://www.getbring.com/en/home');
    expect(bringLink).toHaveAttribute('target', '_blank');
    expect(bringLink).toHaveAttribute('rel', 'noreferrer');
  });

  it('renders the Bring! widget with the recipe URL and English config', () => {
    render(<RecipeCard recipe={baseRecipe} />);

    expect(renderBringWidget).toHaveBeenCalledTimes(1);
    expect(renderBringWidget.mock.calls[0]?.[0]).toBeInstanceOf(HTMLDivElement);
    expect(renderBringWidget).toHaveBeenCalledWith(expect.any(HTMLDivElement), {
      url: 'https://cookpad.com/recipe-1',
      language: 'en',
      theme: 'light',
    });
  });

  it('does not render the "Import to Bring!" button when the recipe URL is empty', () => {
    const recipeWithoutUrl: RecipeDetails = { ...baseRecipe, cookpadUrl: '' };

    render(<RecipeCard recipe={recipeWithoutUrl} />);

    expect(screen.queryByRole('link', { name: 'Import to Bring!' })).not.toBeInTheDocument();
    expect(renderBringWidget).not.toHaveBeenCalled();
  });

  it('keeps the fallback Bring! link when the widget script is unavailable', () => {
    window.bringwidgets = undefined;

    render(<RecipeCard recipe={baseRecipe} />);

    expect(screen.getByRole('link', { name: 'Import to Bring!' })).toBeInTheDocument();
  });

  it('renders the Bring! widget when the script loads after initial render', () => {
    window.bringwidgets = undefined;
    const bringScript = document.createElement('script');
    bringScript.src = 'https://platform.getbring.com/widgets/import.js';
    document.head.appendChild(bringScript);

    render(<RecipeCard recipe={baseRecipe} />);

    expect(renderBringWidget).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Import to Bring!' })).toBeInTheDocument();

    window.bringwidgets = {
      import: {
        render: renderBringWidget,
      },
    };
    bringScript.dispatchEvent(new Event('load'));

    expect(renderBringWidget).toHaveBeenCalledTimes(1);
    expect(renderBringWidget).toHaveBeenCalledWith(expect.any(HTMLDivElement), {
      url: 'https://cookpad.com/recipe-1',
      language: 'en',
      theme: 'light',
    });

    bringScript.remove();
  });

  it('falls back to placeholder text when no image is provided', () => {
    const recipeNoImage: RecipeDetails = { ...baseRecipe, imageUrl: null };

    render(<RecipeCard recipe={recipeNoImage} />);

    expect(screen.getByText('Image coming soon')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('falls back to default description text when description is null', () => {
    const recipeNoDescription: RecipeDetails = { ...baseRecipe, description: null };

    render(<RecipeCard recipe={recipeNoDescription} />);

    expect(screen.getByText('Description coming soon.')).toBeInTheDocument();
  });

  it('falls back to default ingredients text when ingredients list is empty', () => {
    const recipeNoIngredients: RecipeDetails = { ...baseRecipe, ingredients: [] };

    render(<RecipeCard recipe={recipeNoIngredients} />);

    expect(screen.getByText('Ingredients coming soon.')).toBeInTheDocument();
  });
});
