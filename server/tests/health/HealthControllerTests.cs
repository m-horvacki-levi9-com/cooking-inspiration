using CookingInspiration.Server.controllers;
using CookingInspiration.Server.services;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace CookingInspiration.Server.Tests.health;

public sealed class HealthControllerTests
{
    [Fact]
    public void Get_WhenServiceReportsHealthy_ReturnsOkWithStatusPayload()
    {
        var healthService = new Mock<IHealthService>();
        var expectedResponse = new HealthStatusResponse("healthy");
        healthService
            .Setup(service => service.GetHealth())
            .Returns(expectedResponse);

        var controller = new HealthController(healthService.Object);

        var result = controller.Get();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeEquivalentTo(expectedResponse);
        healthService.Verify(service => service.GetHealth(), Times.Once);
    }
}
