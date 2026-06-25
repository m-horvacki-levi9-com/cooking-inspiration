namespace CookingInspiration.Server.services;

public interface IRecipeDetailsService
{
    Task<RecipeDetailsResult> GetByRecipeIdAsync(string? recipeId, CancellationToken cancellationToken);
}
