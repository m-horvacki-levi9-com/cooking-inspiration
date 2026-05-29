using System.Net;
using System.Net.Http.Json;
using CookingInspiration.Server.services;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace CookingInspiration.Server.Tests.health;

public sealed class HealthEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public HealthEndpointTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetHealth_WhenApplicationStarts_ReturnsHealthyResponse()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<HealthStatusResponse>();
        payload.Should().NotBeNull();
        payload!.Status.Should().Be("healthy");
    }
}
