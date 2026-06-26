using CookingInspiration.Server.domain;
using Microsoft.Extensions.Logging;

namespace CookingInspiration.Server.services;

public sealed class RecipeSearchService(
    IRecipeRepositoryFactory recipeRepositoryFactory,
    ILogger<RecipeSearchService> logger) : IRecipeSearchService
{
    public async Task<RecipeSearchResult> SearchAsync(string? keyword, string? providerKey, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(keyword))
        {
            return RecipeSearchResult.InvalidKeyword();
        }

        try
        {
            var recipeRepository = recipeRepositoryFactory.Create(providerKey);
            var recipes = await recipeRepository.SearchSummariesAsync(keyword.Trim(), cancellationToken);
            if (recipes.Count == 0)
            {
                return RecipeSearchResult.ExternalFailure();
            }

            return RecipeSearchResult.Success(new RecipeSearchResponse(recipes));
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to retrieve recipes for keyword '{Keyword}'.", keyword);
            return RecipeSearchResult.ExternalFailure();
        }
    }
}
