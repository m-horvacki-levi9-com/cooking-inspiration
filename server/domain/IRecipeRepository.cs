namespace CookingInspiration.Server.domain;

public interface IRecipeRepository
{
    Task<IReadOnlyList<RecipeSummary>> SearchSummariesAsync(string keyword, CancellationToken cancellationToken);
    Task<RecipeCard?> GetRecipeCardAsync(string recipeId, CancellationToken cancellationToken);
}
