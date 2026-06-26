using CookingInspiration.Server.domain;
using CookingInspiration.Server.infrastructure.Cookpad;
using CookingInspiration.Server.services;

namespace CookingInspiration.Server.infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddServerServices(this IServiceCollection services)
    {
        services.AddScoped<IHealthService, HealthService>();
        services.AddSingleton<IRandomValueProvider, RandomValueProvider>();

        // Recipe provider initialization
        AddRecipeProviders(services);

        // Recipe repository factory - selects a provider per request at runtime
        services.AddScoped<IRecipeRepositoryFactory, RecipeRepositoryFactory>();

        // Recipe services initialization - resolve the provider through the factory
        services.AddScoped<IRecipeSearchService>(provider =>
            new RecipeSearchService(
                provider.GetRequiredService<IRecipeRepositoryFactory>(),
                provider.GetRequiredService<ILogger<RecipeSearchService>>()));
        services.AddScoped<IRecipeDetailsService>(provider =>
            new RecipeDetailsService(provider.GetRequiredService<IRecipeRepositoryFactory>()));

        return services;
    }

    /// <summary>
    /// Initializes recipe data providers. Each provider is registered under a keyed
    /// <see cref="IRecipeRepository"/> entry so the <see cref="IRecipeRepositoryFactory"/>
    /// can resolve one by key at request time.
    /// To add a new recipe provider in the future:
    /// 1. Create a new class implementing <see cref="IRecipeRepository"/>
    /// 2. Add a key constant in <see cref="RecipeProviders"/>
    /// 3. Register it below with AddKeyedScoped under that key (and AddHttpClient if it calls an external API)
    /// </summary>
    private static void AddRecipeProviders(IServiceCollection services)
    {
        // Cookpad provider registration
        services
            .AddHttpClient<CookpadRecipeRepository>()
            .ConfigureHttpClient(client =>
            {
                client.BaseAddress = new Uri(CookpadRecipeRepository.BaseUrl);
                client.Timeout = TimeSpan.FromSeconds(10);
            });

        services.AddKeyedScoped<IRecipeRepository>(
            RecipeProviders.Cookpad,
            (provider, _) => provider.GetRequiredService<CookpadRecipeRepository>());
    }
}
