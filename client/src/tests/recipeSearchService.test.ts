import { apiClient } from '../services/apiClient';
import { searchRecipes } from '../services/recipeSearchService';

describe('searchRecipes', () => {
  it('requests recipes from the backend with the expected keyword query parameter', async () => {
    const apiClientGetSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        recipes: [
          {
            title: 'Paprika Chicken',
            cookpadUrl: 'https://cookpad.com/recipe-1',
            imageUrl: null,
            description: 'Simple one-pan chicken.',
          },
        ],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: {},
      },
    });

    const recipes = await searchRecipes('paprika');

    expect(apiClientGetSpy).toHaveBeenCalledWith('/recipes/search', {
      params: {
        keyword: 'paprika',
      },
    });
    expect(recipes).toEqual([
      {
        title: 'Paprika Chicken',
        cookpadUrl: 'https://cookpad.com/recipe-1',
        imageUrl: null,
        description: 'Simple one-pan chicken.',
      },
    ]);
  });
});
