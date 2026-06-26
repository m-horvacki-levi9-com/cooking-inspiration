namespace CookingInspiration.Server.infrastructure.Cookpad;

public sealed record CookpadRecipeDetails(
    string RecipeId,
    string Title,
    string CookpadUrl,
    string? ImageUrl,
    string? Description,
    IReadOnlyList<string> Ingredients,
    IReadOnlyList<string> MethodSteps);
