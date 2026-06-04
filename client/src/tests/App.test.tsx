import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from '../App';
import { searchRecipes, type RecipeSummary } from '../services/recipeSearchService';

vi.mock('../services/recipeSearchService', () => ({
  searchRecipes: vi.fn(),
}));

type DeferredPromise<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

function createDeferredPromise<T>(): DeferredPromise<T> {
  let resolvePromise!: (value: T | PromiseLike<T>) => void;
  let rejectPromise!: (reason?: unknown) => void;

  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return {
    promise,
    resolve: resolvePromise,
    reject: rejectPromise,
  };
}

const mockedSearchRecipes = vi.mocked(searchRecipes);

describe('App', () => {
  beforeEach(() => {
    mockedSearchRecipes.mockReset();
  });

  it('renders the recipe search experience', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Cooking Inspiration' })).toBeInTheDocument();
    expect(screen.getByText('Search Cookpad recipes by keyword and discover your next meal idea.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Find a recipe to cook tonight' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search recipes by keyword' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
  });

  it('prevents empty or whitespace-only searches', async () => {
    const user = userEvent.setup();

    render(<App />);

    const searchInput = screen.getByRole('textbox', { name: 'Search recipes by keyword' });

    await user.type(searchInput, '   ');

    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
    expect(mockedSearchRecipes).not.toHaveBeenCalled();
  });

  it('shows a loading state and then renders returned recipes', async () => {
    const user = userEvent.setup();
    const expectedRecipes: RecipeSummary[] = [
      {
        title: 'Creamy Pesto Pasta',
        cookpadUrl: 'https://cookpad.com/recipe-1',
        imageUrl: 'https://images.example.com/pasta.jpg',
        description: 'A quick pasta dinner with pesto and cream.',
        ingredients: ['Pasta', 'Pesto', 'Cream'],
      },
      {
        title: 'Roasted Tomato Soup',
        cookpadUrl: 'https://cookpad.com/recipe-2',
        imageUrl: 'https://images.example.com/soup.jpg',
        description: 'Velvety tomato soup with roasted garlic.',
        ingredients: ['Tomatoes', 'Garlic', 'Vegetable stock'],
      },
      {
        title: 'Lemon Herb Chicken',
        cookpadUrl: 'https://cookpad.com/recipe-3',
        imageUrl: 'https://images.example.com/chicken.jpg',
        description: 'Oven baked chicken with lemon and herbs.',
        ingredients: [],
      },
      {
        title: 'Berry Oat Crumble',
        cookpadUrl: 'https://cookpad.com/recipe-4',
        imageUrl: null,
        description: null,
        ingredients: [],
      },
    ];
    const deferredSearch = createDeferredPromise<RecipeSummary[]>();

    mockedSearchRecipes.mockReturnValueOnce(deferredSearch.promise);

    render(<App />);

    await user.type(screen.getByRole('textbox', { name: 'Search recipes by keyword' }), '  pasta  ');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(mockedSearchRecipes).toHaveBeenCalledWith('pasta');
    expect(screen.getByRole('button', { name: 'Searching…' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Searching recipes for “pasta”…');

    deferredSearch.resolve(expectedRecipes);

    expect(await screen.findByRole('heading', { level: 3, name: 'Creamy Pesto Pasta' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Recipe ideas' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(4);
    expect(screen.getAllByRole('link', { name: 'View recipe' })).toHaveLength(4);
    expect(screen.getAllByText('Ingredients')).toHaveLength(4);
    expect(screen.getByText('Pasta')).toBeInTheDocument();
    expect(screen.getByText('Vegetable stock')).toBeInTheDocument();
    expect(screen.getByText('Description coming soon.')).toBeInTheDocument();
    expect(screen.getAllByText('Ingredients coming soon.')).toHaveLength(2);
  });

  it('shows an explicit no-results state when the backend returns no recipes', async () => {
    const user = userEvent.setup();

    mockedSearchRecipes.mockResolvedValueOnce([]);

    render(<App />);

    await user.type(screen.getByRole('textbox', { name: 'Search recipes by keyword' }), 'pumpkin');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('No recipes found for “pumpkin”. Try another keyword.')).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('shows a clear failure state when the search request fails', async () => {
    const user = userEvent.setup();

    mockedSearchRecipes.mockRejectedValueOnce(new Error('Cookpad unavailable'));

    render(<App />);

    await user.type(screen.getByRole('textbox', { name: 'Search recipes by keyword' }), 'soup');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(
      await screen.findByText('We couldn’t load recipes right now. Please try again in a moment.'),
    ).toBeInTheDocument();
  });
});
