using CookingInspiration.Server.services;
using Microsoft.AspNetCore.Mvc;

namespace CookingInspiration.Server.controllers;

[ApiController]
[Route("health")]
public sealed class HealthController(IHealthService healthService) : ControllerBase
{
    [HttpGet]
    public ActionResult<HealthStatusResponse> Get()
    {
        var response = healthService.GetHealth();

        return Ok(response);
    }
}
