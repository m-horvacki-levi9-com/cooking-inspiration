import { render, screen, waitFor } from '@testing-library/react';
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

  const bringInspiredRecipe: RecipeSummary = {
    title: 'Creamy Pesto Pasta',
    cookpadUrl: 'https://cookpad.com/recipe-1',
    imageUrl: 'https://images.example.com/pasta.jpg',
    description: 'A quick pasta dinner with pesto and cream.',
    ingredients: ['Pasta', 'Pesto', 'Cream'],
  };

  it('renders the recipe search experience', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Search Cookpad recipes' })).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'What would you like to eat for the weekend?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
  });

  it('uses a light shell and search button styling that matches the live Bring widget button', async () => {
    const user = userEvent.setup();

    mockedSearchRecipes.mockResolvedValueOnce([bringInspiredRecipe]);

    render(<App />);

    const appShell = screen.getByRole('main').parentElement;

    expect(appShell).not.toBeNull();
    expect(getComputedStyle(appShell!).backgroundColor).toBe('rgb(242, 247, 234)');

    const searchInput = screen.getByRole('textbox', {
      name: 'What would you like to eat for the weekend?',
    });
    const searchPanel = searchInput.closest('form');

    expect(searchPanel).not.toBeNull();
    expect(getComputedStyle(searchPanel!).backgroundColor).toBe('rgba(250, 252, 246, 0.94)');

    await user.type(searchInput, 'pasta');

    const searchButton = screen.getByRole('button', { name: 'Search' });

    expect(getComputedStyle(searchButton).backgroundColor).toBe('rgb(248, 248, 248)');
    expect(getComputedStyle(searchButton).color).toBe('rgb(37, 48, 54)');
    expect(getComputedStyle(searchButton).border).toBe('1px solid rgba(151, 151, 151, 0.1)');
    expect(getComputedStyle(searchButton).borderRadius).toBe('4px');
    expect(getComputedStyle(searchButton).boxShadow).toBe(
      '0px 2px 2px 0px rgba(0, 0, 0, 0.2)',
    );

    await user.click(searchButton);

    const resultsHeading = await screen.findByRole('heading', { level: 2, name: 'Recipe ideas' });
    const resultsSection = resultsHeading.closest('section');

    expect(resultsSection).not.toBeNull();
    expect(getComputedStyle(resultsSection!).backgroundColor).toBe('rgba(250, 252, 246, 0.94)');
  });

  it('prevents empty or whitespace-only searches', async () => {
    const user = userEvent.setup();

    render(<App />);

    const searchInput = screen.getByRole('textbox', {
      name: 'What would you like to eat for the weekend?',
    });

    await user.type(searchInput, '   ');

    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
    expect(mockedSearchRecipes).not.toHaveBeenCalled();
  });

  it('shows a loading state and then renders returned recipes as a list', async () => {
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

    await user.type(
      screen.getByRole('textbox', { name: 'What would you like to eat for the weekend?' }),
      '  pasta  ',
    );
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(mockedSearchRecipes).toHaveBeenCalledWith('pasta');
    expect(screen.getByRole('button', { name: 'Searching…' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Searching recipes for “pasta”…');

    deferredSearch.resolve(expectedRecipes);

    expect(await screen.findByRole('heading', { level: 3, name: 'Creamy Pesto Pasta' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Recipe ideas' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(4);
    expect(screen.getAllByRole('button', { name: 'View details' })).toHaveLength(4);
    expect(screen.getAllByRole('link', { name: 'Import to Bring!' })).toHaveLength(4);
    expect(screen.getByText('A quick pasta dinner with pesto and cream.')).toBeInTheDocument();
    expect(screen.getByText('Description coming soon.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the recipe detail modal when "View details" is clicked', async () => {
    const user = userEvent.setup();
    const recipes: RecipeSummary[] = [
      {
        title: 'Creamy Pesto Pasta',
        cookpadUrl: 'https://cookpad.com/recipe-1',
        imageUrl: 'https://images.example.com/pasta.jpg',
        description: 'A quick pasta dinner with pesto and cream.',
        ingredients: ['Pasta', 'Pesto', 'Cream'],
      },
    ];

    mockedSearchRecipes.mockResolvedValueOnce(recipes);

    render(<App />);

    await user.type(
      screen.getByRole('textbox', { name: 'What would you like to eat for the weekend?' }),
      'pasta',
    );
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await screen.findByRole('heading', { level: 3, name: 'Creamy Pesto Pasta' });

    await user.click(screen.getByRole('button', { name: 'View details' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Pasta')).toBeInTheDocument();
    expect(screen.getByText('Pesto')).toBeInTheDocument();
    expect(screen.getByText('We will soon add method steps here')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('restores focus to the triggering "View details" button when the modal closes', async () => {
    const user = userEvent.setup();
    const recipes: RecipeSummary[] = [
      {
        title: 'Creamy Pesto Pasta',
        cookpadUrl: 'https://cookpad.com/recipe-1',
        imageUrl: 'https://images.example.com/pasta.jpg',
        description: 'A quick pasta dinner with pesto and cream.',
        ingredients: ['Pasta', 'Pesto', 'Cream'],
      },
    ];

    mockedSearchRecipes.mockResolvedValueOnce(recipes);

    render(<App />);

    await user.type(
      screen.getByRole('textbox', { name: 'What would you like to eat for the weekend?' }),
      'pasta',
    );
    await user.click(screen.getByRole('button', { name: 'Search' }));

    const viewDetailsButton = await screen.findByRole('button', { name: 'View details' });

    await user.click(viewDetailsButton);
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(viewDetailsButton).toHaveFocus();
  });

  it('Import to Bring! remains available for each recipe in the results list', async () => {
    const user = userEvent.setup();
    const recipes: RecipeSummary[] = [
      {
        title: 'Creamy Pesto Pasta',
        cookpadUrl: 'https://cookpad.com/recipe-1',
        imageUrl: null,
        description: null,
        ingredients: [],
      },
      {
        title: 'Roasted Tomato Soup',
        cookpadUrl: 'https://cookpad.com/recipe-2',
        imageUrl: null,
        description: null,
        ingredients: [],
      },
    ];

    mockedSearchRecipes.mockResolvedValueOnce(recipes);

    render(<App />);

    await user.type(
      screen.getByRole('textbox', { name: 'What would you like to eat for the weekend?' }),
      'pasta',
    );
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await screen.findByRole('heading', { level: 3, name: 'Creamy Pesto Pasta' });

    expect(screen.getAllByRole('link', { name: 'Import to Bring!' })).toHaveLength(2);
  });

  it('shows an explicit no-results state when the backend returns no recipes', async () => {
    const user = userEvent.setup();

    mockedSearchRecipes.mockResolvedValueOnce([]);

    render(<App />);

    await user.type(
      screen.getByRole('textbox', { name: 'What would you like to eat for the weekend?' }),
      'pumpkin',
    );
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('No recipes found for “pumpkin”. Try another keyword.')).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('shows a clear failure state when the search request fails', async () => {
    const user = userEvent.setup();

    mockedSearchRecipes.mockRejectedValueOnce(new Error('Cookpad unavailable'));

    render(<App />);

    await user.type(
      screen.getByRole('textbox', { name: 'What would you like to eat for the weekend?' }),
      'soup',
    );
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(
      await screen.findByText('We couldn’t load recipes right now. Please try again in a moment.'),
    ).toBeInTheDocument();
  });
});
