namespace CookingInspiration.Server.domain;

public sealed record RecipeCard(
    string RecipeId,
    string Title,
    string CookpadUrl,
    string? ImageUrl,
    string? Description,
    IReadOnlyList<string> Ingredients,
    IReadOnlyList<string> MethodSteps);
