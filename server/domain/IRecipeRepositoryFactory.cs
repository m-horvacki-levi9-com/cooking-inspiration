namespace CookingInspiration.Server.domain;

public interface IRecipeRepositoryFactory
{
    IRecipeRepository Create(string? providerKey);
}
