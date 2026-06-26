namespace CookingInspiration.Server.infrastructure.Cookpad;

public sealed record CookpadRecipeCandidate(
    string RecipeId,
    string Title,
    string CookpadUrl,
    string? ImageUrl,
    string? Description);
