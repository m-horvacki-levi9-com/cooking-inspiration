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

        var selectedRecipes = searchResult.Recipes
            .OrderBy(_ => randomValueProvider.Next())
            .Take(MaximumRecipeCount)
            .ToArray();

        var recipes = await BuildRecipesAsync(selectedRecipes, cancellationToken);
        return RecipeSearchResult.Success(new RecipeSearchResponse(recipes));
    }

    private async Task<IReadOnlyList<RecipeSearchRecipe>> BuildRecipesAsync(
        IReadOnlyList<CookpadRecipeCandidate> selectedRecipes,
        CancellationToken cancellationToken)
    {
        var recipeTasks = selectedRecipes
            .Select(recipe => BuildRecipeAsync(recipe, cancellationToken))
            .ToArray();

        return await Task.WhenAll(recipeTasks);
    }

    private async Task<RecipeSearchRecipe> BuildRecipeAsync(
        CookpadRecipeCandidate recipe,
        CancellationToken cancellationToken)
    {
        var details = await GetDetailsForMissingMetadataAsync(recipe, cancellationToken);
        var title = NeedsTitleEnrichment(recipe.Title)
            ? FirstNonEmpty(details?.Title, recipe.Title)!
            : recipe.Title;

        return new RecipeSearchRecipe(
            recipe.RecipeId,
            title,
            FirstNonEmpty(details?.CookpadUrl, recipe.CookpadUrl)!,
            FirstNonEmpty(recipe.ImageUrl, details?.ImageUrl),
            FirstNonEmpty(recipe.Description, details?.Description));
    }

    private async Task<CookpadRecipeDetails?> GetDetailsForMissingMetadataAsync(
        CookpadRecipeCandidate recipe,
        CancellationToken cancellationToken)
    {
        if (!NeedsMetadataEnrichment(recipe))
        {
            return null;
        }

        var detailsResult = await cookpadRecipeSearchGateway.GetByRecipeIdAsync(recipe.RecipeId, cancellationToken);
        if (detailsResult is null)
        {
            return null;
        }

        return detailsResult.Status == CookpadRecipeDetailsStatus.Success
            ? detailsResult.Details
            : null;
    }

    private static bool NeedsMetadataEnrichment(CookpadRecipeCandidate recipe)
    {
        return NeedsTitleEnrichment(recipe.Title)
            || string.IsNullOrWhiteSpace(recipe.ImageUrl)
            || string.IsNullOrWhiteSpace(recipe.Description);
    }

    private static bool NeedsTitleEnrichment(string title)
    {
        return title.StartsWith("Recipe ", StringComparison.OrdinalIgnoreCase)
            || title.Equals("Recipe", StringComparison.OrdinalIgnoreCase);
    }

    private static string? FirstNonEmpty(params string?[] values)
    {
        return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
    }
}
