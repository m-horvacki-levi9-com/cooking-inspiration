namespace CookingInspiration.Server.services;

public sealed record RecipeDetailsResponse(
    string RecipeId,
    string Title,
    string CookpadUrl,
    string? ImageUrl,
    string? Description,
    IReadOnlyList<string> Ingredients,
    IReadOnlyList<string> MethodSteps);
