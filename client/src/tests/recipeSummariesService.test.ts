import { apiClient } from '../services/apiClient';
import { searchRecipes } from '../services/recipeSummariesService';

describe('searchRecipes', () => {
  it('GivenKeyword_WhenSearchingRecipes_ThenRequestsSearchEndpointAndReturnsCompactRecipes', async () => {
    // Arrange
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

    // Act
    const recipes = await searchRecipes('paprika');

    // Assert
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

  it('GivenCompactResponseContainsExtraFields_WhenSearchingRecipes_ThenOmitsIngredientsAndMethodStepsFromResults', async () => {
    // Arrange
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

    // Act
    const recipes = await searchRecipes('simple');

    // Assert
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