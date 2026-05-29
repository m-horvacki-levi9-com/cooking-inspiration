namespace CookingInspiration.Server.infrastructure;

public sealed record CookpadRecipeCandidate(string Title, string CookpadUrl, string? ImageUrl, string? Description);
