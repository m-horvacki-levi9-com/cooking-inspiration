namespace CookingInspiration.Server.services;

public interface IHealthService
{
    HealthStatusResponse GetHealth();
}
