import { apiClient } from '../services/apiClient';
import { searchRecipes } from '../services/recipeSearchService';

describe('searchRecipes', () => {
  it('requests compact recipes from the backend with the expected keyword query parameter', async () => {
    const apiClientGetSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        recipes: [
          {
            recipeId: '11111',
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
        recipeId: '11111',
        title: 'Paprika Chicken',
        cookpadUrl: 'https://cookpad.com/recipe-1',
        imageUrl: null,
        description: 'Simple one-pan chicken.',
      },
    ]);
  });

  it('does not expect ingredients or method steps in compact response items', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        recipes: [
          {
            recipeId: '22222',
            title: 'Tomato Toast',
            cookpadUrl: 'https://cookpad.com/recipe-2',
            imageUrl: null,
            description: 'Quick toast with tomato.',
            ingredients: ['Tomato', 'Bread'],
            methodSteps: ['Toast bread'],
          },
          {
            recipeId: '33333',
            title: 'Butter Rice',
            cookpadUrl: 'https://cookpad.com/recipe-3',
            imageUrl: null,
            description: 'Simple rice side.',
            methodSteps: ['Cook rice'],
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

    const recipes = await searchRecipes('simple');

    expect(recipes).toEqual([
      {
        recipeId: '22222',
        title: 'Tomato Toast',
        cookpadUrl: 'https://cookpad.com/recipe-2',
        imageUrl: null,
        description: 'Quick toast with tomato.',
      },
      {
        recipeId: '33333',
        title: 'Butter Rice',
        cookpadUrl: 'https://cookpad.com/recipe-3',
        imageUrl: null,
        description: 'Simple rice side.',
      },
    ]);
  });
});
