import { apiClient } from '../services/apiClient';
import { getRecipeDetails } from '../services/recipeCardService';

describe('getRecipeDetails', () => {
  it('GivenRecipeId_WhenFetchingRecipeDetails_ThenRequestsDetailsEndpointAndReturnsMappedRecipe', async () => {
    // Arrange
    const apiClientGetSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        recipeId: '11111',
        title: 'Paprika Chicken',
        cookpadUrl: 'https://cookpad.com/eng/recipes/11111',
        imageUrl: 'https://images.example.com/11111.jpg',
        description: 'Simple one-pan chicken.',
        ingredients: ['Chicken thighs', 'Paprika', 'Onion'],
        methodSteps: ['Season chicken.', 'Roast chicken.'],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: {},
      },
    });

    // Act
    const recipe = await getRecipeDetails('11111');

    // Assert
    expect(apiClientGetSpy).toHaveBeenCalledWith('/recipes/11111');
    expect(recipe).toEqual({
      recipeId: '11111',
      title: 'Paprika Chicken',
      cookpadUrl: 'https://cookpad.com/eng/recipes/11111',
      imageUrl: 'https://images.example.com/11111.jpg',
      description: 'Simple one-pan chicken.',
      ingredients: ['Chicken thighs', 'Paprika', 'Onion'],
      methodSteps: ['Season chicken.', 'Roast chicken.'],
    });
  });

  it('GivenMissingIngredientAndMethodCollections_WhenFetchingRecipeDetails_ThenNormalizesThemToEmptyArrays', async () => {
    // Arrange
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        recipeId: '22222',
        title: 'Tomato Toast',
        cookpadUrl: 'https://cookpad.com/eng/recipes/22222',
        imageUrl: null,
        description: null,
        ingredients: null,
        methodSteps: null,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: {},
      },
    });

    // Act
    const recipe = await getRecipeDetails('22222');

    // Assert
    expect(recipe).toEqual({
      recipeId: '22222',
      title: 'Tomato Toast',
      cookpadUrl: 'https://cookpad.com/eng/recipes/22222',
      imageUrl: null,
      description: null,
      ingredients: [],
      methodSteps: [],
    });
  });
});