namespace CookingInspiration.Server.services;

public sealed class HealthService : IHealthService
{
    public HealthStatusResponse GetHealth()
    {
        return new HealthStatusResponse("healthy");
    }
}
