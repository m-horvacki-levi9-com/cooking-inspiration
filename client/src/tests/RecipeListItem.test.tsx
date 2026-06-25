import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RecipeListItem from '../components/RecipeListItem';
import type { RecipeSummary } from '../services/recipeSearchService';

const baseRecipe: RecipeSummary = {
  title: 'Creamy Pesto Pasta',
  cookpadUrl: 'https://cookpad.com/recipe-1',
  imageUrl: 'https://images.example.com/pasta.jpg',
  description: 'A quick pasta dinner with pesto and cream.',
  ingredients: ['Pasta', 'Pesto', 'Cream'],
};

const renderBringWidget = vi.fn();

describe('RecipeListItem', () => {
  beforeEach(() => {
    renderBringWidget.mockReset();
    window.bringwidgets = {
      import: {
        render: renderBringWidget,
      },
    };
  });

  it('renders as an article with the recipe title heading', () => {
    render(<RecipeListItem recipe={baseRecipe} onViewDetails={vi.fn()} />);

    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Creamy Pesto Pasta' })).toBeInTheDocument();
  });

  it('renders the recipe thumbnail image with descriptive alt text', () => {
    render(<RecipeListItem recipe={baseRecipe} onViewDetails={vi.fn()} />);

    const image = screen.getByRole('img', { name: 'Creamy Pesto Pasta' });

    expect(image).toHaveAttribute('src', 'https://images.example.com/pasta.jpg');
  });

  it('renders no img element when imageUrl is null', () => {
    const noImageRecipe: RecipeSummary = { ...baseRecipe, imageUrl: null };

    render(<RecipeListItem recipe={noImageRecipe} onViewDetails={vi.fn()} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders the description preview for a short description', () => {
    render(<RecipeListItem recipe={baseRecipe} onViewDetails={vi.fn()} />);

    expect(screen.getByText('A quick pasta dinner with pesto and cream.')).toBeInTheDocument();
  });

  it('truncates a long description to a short preview ending with an ellipsis', () => {
    const longDescription = 'a'.repeat(200);
    const longRecipe: RecipeSummary = { ...baseRecipe, description: longDescription };

    render(<RecipeListItem recipe={longRecipe} onViewDetails={vi.fn()} />);

    expect(screen.queryByText(longDescription)).not.toBeInTheDocument();

    const preview = screen.getByText(/^a+\u2026$/);

    expect(preview.textContent!.length).toBeLessThan(longDescription.length);
  });

  it('renders no description text when description is null', () => {
    const noDescRecipe: RecipeSummary = { ...baseRecipe, description: null };

    render(<RecipeListItem recipe={noDescRecipe} onViewDetails={vi.fn()} />);

    expect(screen.getByText('Description coming soon.')).toBeInTheDocument();
  });

  it('renders a "View details" button', () => {
    render(<RecipeListItem recipe={baseRecipe} onViewDetails={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'View details' })).toBeInTheDocument();
  });

  it('calls onViewDetails when the "View details" button is activated', async () => {
    const user = userEvent.setup();
    const onViewDetails = vi.fn();

    render(<RecipeListItem recipe={baseRecipe} onViewDetails={onViewDetails} />);

    await user.click(screen.getByRole('button', { name: 'View details' }));

    expect(onViewDetails).toHaveBeenCalledTimes(1);
  });

  it('shows an "Import to Bring!" link when the recipe has a URL', () => {
    render(<RecipeListItem recipe={baseRecipe} onViewDetails={vi.fn()} />);

    const bringLink = screen.getByRole('link', { name: 'Import to Bring!' });

    expect(bringLink).toHaveAttribute('href', 'https://www.getbring.com/en/home');
    expect(bringLink).toHaveAttribute('target', '_blank');
    expect(bringLink).toHaveAttribute('rel', 'noreferrer');
  });

  it('does not render "Import to Bring!" when cookpadUrl is empty', () => {
    const noUrlRecipe: RecipeSummary = { ...baseRecipe, cookpadUrl: '' };

    render(<RecipeListItem recipe={noUrlRecipe} onViewDetails={vi.fn()} />);

    expect(screen.queryByRole('link', { name: 'Import to Bring!' })).not.toBeInTheDocument();
    expect(renderBringWidget).not.toHaveBeenCalled();
  });

  it('renders the Bring! widget with the recipe URL and English config', () => {
    render(<RecipeListItem recipe={baseRecipe} onViewDetails={vi.fn()} />);

    expect(renderBringWidget).toHaveBeenCalledTimes(1);
    expect(renderBringWidget).toHaveBeenCalledWith(expect.any(HTMLDivElement), {
      url: 'https://cookpad.com/recipe-1',
      language: 'en',
      theme: 'light',
    });
  });

  it('keeps the fallback Bring! link when the widget script is unavailable', () => {
    window.bringwidgets = undefined;

    render(<RecipeListItem recipe={baseRecipe} onViewDetails={vi.fn()} />);

    expect(screen.getByRole('link', { name: 'Import to Bring!' })).toBeInTheDocument();
  });

  it('renders the Bring! widget when the script loads after initial render', () => {
    window.bringwidgets = undefined;
    const bringScript = document.createElement('script');
    bringScript.src = 'https://platform.getbring.com/widgets/import.js';
    document.head.appendChild(bringScript);

    render(<RecipeListItem recipe={baseRecipe} onViewDetails={vi.fn()} />);

    expect(renderBringWidget).not.toHaveBeenCalled();

    window.bringwidgets = { import: { render: renderBringWidget } };
    bringScript.dispatchEvent(new Event('load'));

    expect(renderBringWidget).toHaveBeenCalledTimes(1);
    expect(renderBringWidget).toHaveBeenCalledWith(expect.any(HTMLDivElement), {
      url: 'https://cookpad.com/recipe-1',
      language: 'en',
      theme: 'light',
    });

    bringScript.remove();
  });
});
