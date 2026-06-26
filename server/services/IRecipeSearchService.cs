namespace CookingInspiration.Server.services;

public interface IRecipeSearchService
{
    Task<RecipeSearchResult> SearchAsync(string? keyword, string? providerKey, CancellationToken cancellationToken);
}
