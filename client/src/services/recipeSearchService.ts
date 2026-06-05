import { apiClient } from './apiClient';

export type RecipeSummary = {
  title: string;
  cookpadUrl: string;
  imageUrl: string | null;
  description: string | null;
  ingredients: string[];
};

type RecipeSearchResponse = {
  recipes: Array<Omit<RecipeSummary, 'ingredients'> & { ingredients?: string[] | null }>;
};

export async function searchRecipes(keyword: string): Promise<RecipeSummary[]> {
  const response = await apiClient.get<RecipeSearchResponse>('/recipes/search', {
    params: {
      keyword: keyword.trim(),
    },
  });

  return response.data.recipes.map((recipe) => ({
    ...recipe,
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
  }));
}
