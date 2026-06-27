import { apiClient } from './apiClient';

export type RecipeSearchListItem = {
  recipeId: string;
  title: string;
  cookpadUrl: string;
  imageUrl: string | null;
  description: string | null;
};

type RecipeSearchResponse = {
  recipes: RecipeSearchListItem[];
};

export async function searchRecipes(keyword: string): Promise<RecipeSearchListItem[]> {
  const response = await apiClient.get<RecipeSearchResponse>('/recipes/search', {
    params: {
      keyword: keyword.trim(),
    },
  });

  return response.data.recipes.map((recipe) => ({
    recipeId: recipe.recipeId,
    title: recipe.title,
    cookpadUrl: recipe.cookpadUrl,
    imageUrl: recipe.imageUrl,
    description: recipe.description,
  }));
}