using CookingInspiration.Server.services;

namespace CookingInspiration.Server.infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddServerServices(this IServiceCollection services)
    {
        services.AddScoped<IHealthService, HealthService>();
        services.AddScoped<IRecipeSearchService, RecipeSearchService>();
        services.AddSingleton<IRandomValueProvider, RandomValueProvider>();
        services.AddHttpClient<ICookpadRecipeSearchGateway, CookpadRecipeSearchGateway>(client =>
        {
            client.BaseAddress = new Uri("https://cookpad.com");
            client.DefaultRequestHeaders.UserAgent.ParseAdd("CookingInspiration/1.0");
        });

        return services;
    }
}
