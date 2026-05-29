import { apiClient } from './apiClient';

export type RecipeSummary = {
  title: string;
  cookpadUrl: string;
  imageUrl: string | null;
  description: string | null;
};

type RecipeSearchResponse = {
  recipes: RecipeSummary[];
};

export async function searchRecipes(keyword: string): Promise<RecipeSummary[]> {
  const response = await apiClient.get<RecipeSearchResponse>('/recipes/search', {
    params: {
      keyword: keyword.trim(),
    },
  });

  return response.data.recipes;
}
