using CookingInspiration.Server.infrastructure;

namespace CookingInspiration.Server.services;

public sealed class RecipeSearchService(
    ICookpadRecipeSearchGateway cookpadRecipeSearchGateway,
    IRandomValueProvider randomValueProvider) : IRecipeSearchService
{
    private const int MaximumRecipeCount = 4;

    public async Task<RecipeSearchResult> SearchAsync(string? keyword, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(keyword))
        {
            return RecipeSearchResult.InvalidKeyword();
        }

        var searchResult = await cookpadRecipeSearchGateway.SearchAsync(keyword.Trim(), cancellationToken);
        if (!searchResult.IsSuccess)
        {
            return RecipeSearchResult.ExternalFailure();
        }

        var recipes = searchResult.Recipes
            .OrderBy(_ => randomValueProvider.Next())
            .Take(MaximumRecipeCount)
            .Select(recipe => new RecipeSearchRecipe(
                recipe.RecipeId,
                recipe.Title,
                recipe.CookpadUrl,
                recipe.ImageUrl,
                recipe.Description))
            .ToArray();

        return RecipeSearchResult.Success(new RecipeSearchResponse(recipes));
    }
}
