using CookingInspiration.Server.domain;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CookingInspiration.Server.infrastructure;

public sealed class RecipeRepositoryFactory(
    IServiceProvider serviceProvider,
    ILogger<RecipeRepositoryFactory> logger) : IRecipeRepositoryFactory
{
    public IRecipeRepository Create(string? providerKey)
    {
        var normalizedKey = RecipeProviders.Normalize(providerKey);
        var repository = serviceProvider.GetKeyedService<IRecipeRepository>(normalizedKey);
        if (repository is not null)
        {
            return repository;
        }

        logger.LogWarning(
            "Unknown recipe provider '{ProviderKey}'. Falling back to default provider '{DefaultProvider}'.",
            normalizedKey,
            RecipeProviders.Default);

        return serviceProvider.GetRequiredKeyedService<IRecipeRepository>(RecipeProviders.Default);
    }
}
