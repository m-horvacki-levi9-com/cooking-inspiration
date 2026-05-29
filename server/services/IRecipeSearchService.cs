namespace CookingInspiration.Server.services;

public interface IRecipeSearchService
{
    Task<RecipeSearchResult> SearchAsync(string? keyword, CancellationToken cancellationToken);
}
