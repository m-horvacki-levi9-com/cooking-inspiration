namespace CookingInspiration.Server.services;

public sealed record RecipeSearchRecipe(
    string RecipeId,
    string Title,
    string CookpadUrl,
    string? ImageUrl,
    string? Description);
