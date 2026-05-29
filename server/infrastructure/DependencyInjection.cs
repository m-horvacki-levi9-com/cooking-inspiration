using CookingInspiration.Server.services;

namespace CookingInspiration.Server.infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddServerServices(this IServiceCollection services)
    {
        services.AddScoped<IHealthService, HealthService>();

        return services;
    }
}
