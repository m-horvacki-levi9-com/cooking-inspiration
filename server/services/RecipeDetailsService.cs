using System.Text.RegularExpressions;
using CookingInspiration.Server.domain;

namespace CookingInspiration.Server.services;

public sealed partial class RecipeDetailsService(IRecipeRepositoryFactory recipeRepositoryFactory) : IRecipeDetailsService
{
    public async Task<RecipeDetailsResult> GetByRecipeIdAsync(string? recipeId, string? providerKey, CancellationToken cancellationToken)
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

        var recipeRepository = recipeRepositoryFactory.Create(providerKey);
        var recipeCard = await recipeRepository.GetRecipeCardAsync(normalizedRecipeId, cancellationToken);
        return recipeCard is not null
            ? RecipeDetailsResult.Success(recipeCard)
            : RecipeDetailsResult.NotFound();
    }

    [GeneratedRegex("^\\d+$")]
    private static partial Regex DigitsRegex();
}
