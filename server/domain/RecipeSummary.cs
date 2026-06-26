namespace CookingInspiration.Server.domain;

public sealed record RecipeSummary(
    string RecipeId,
    string Title,
    string CookpadUrl,
    string? ImageUrl,
    string? Description);
