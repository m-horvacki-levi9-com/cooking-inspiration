using System.Text.RegularExpressions;
using CookingInspiration.Server.infrastructure;

namespace CookingInspiration.Server.services;

public sealed partial class RecipeDetailsService(ICookpadRecipeSearchGateway cookpadRecipeSearchGateway) : IRecipeDetailsService
{
    public async Task<RecipeDetailsResult> GetByRecipeIdAsync(string? recipeId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(recipeId))
        {
            return RecipeDetailsResult.InvalidRecipeId();
        }

        var normalizedRecipeId = recipeId.Trim();
        if (!DigitsRegex().IsMatch(normalizedRecipeId))
        {
            return RecipeDetailsResult.InvalidRecipeId();
        }

        var detailsResult = await cookpadRecipeSearchGateway.GetByRecipeIdAsync(normalizedRecipeId, cancellationToken);
        return detailsResult.Status switch
        {
            CookpadRecipeDetailsStatus.Success => RecipeDetailsResult.Success(new RecipeDetailsResponse(
                detailsResult.Details!.RecipeId,
                detailsResult.Details.Title,
                detailsResult.Details.CookpadUrl,
                detailsResult.Details.ImageUrl,
                detailsResult.Details.Description,
                detailsResult.Details.Ingredients,
                detailsResult.Details.MethodSteps)),
            CookpadRecipeDetailsStatus.NotFound => RecipeDetailsResult.NotFound(),
            CookpadRecipeDetailsStatus.Failure => RecipeDetailsResult.ExternalFailure(),
            _ => throw new InvalidOperationException($"Unsupported details status '{detailsResult.Status}'.")
        };
    }

    [GeneratedRegex("^\\d+$")]
    private static partial Regex DigitsRegex();
}
