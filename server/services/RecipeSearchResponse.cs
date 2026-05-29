namespace CookingInspiration.Server.services;

public sealed record RecipeSearchResponse(IReadOnlyList<RecipeSearchRecipe> Recipes);
