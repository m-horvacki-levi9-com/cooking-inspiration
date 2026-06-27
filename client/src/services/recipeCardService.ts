import { apiClient } from './apiClient';

export type RecipeDetails = {
  recipeId: string;
  title: string;
  cookpadUrl: string;
  imageUrl: string | null;
  description: string | null;
  ingredients: string[];
  methodSteps: string[];
};

type RecipeDetailsResponse = Omit<RecipeDetails, 'ingredients' | 'methodSteps'> & {
  ingredients?: string[] | null;
  methodSteps?: string[] | null;
};

export async function getRecipeDetails(recipeId: string): Promise<RecipeDetails> {
  const normalizedRecipeId = recipeId.trim();
  const response = await apiClient.get<RecipeDetailsResponse>(`/recipes/${normalizedRecipeId}`);
  const recipe = response.data;

  return {
    recipeId: recipe.recipeId,
    title: recipe.title,
    cookpadUrl: recipe.cookpadUrl,
    imageUrl: recipe.imageUrl,
    description: recipe.description,
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    methodSteps: Array.isArray(recipe.methodSteps) ? recipe.methodSteps : [],
  };
}