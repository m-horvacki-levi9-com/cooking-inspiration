using CookingInspiration.Server.infrastructure;
using CookingInspiration.Server.services;
using FluentAssertions;
using Moq;

namespace CookingInspiration.Server.Tests.recipes;

public sealed class RecipeDetailsServiceTests
{
    [Fact]
    public async Task GetByRecipeIdAsync_WhenRecipeIdIsInvalid_ReturnsInvalidRecipeIdWithoutCallingGateway()
    {
        var gateway = new Mock<ICookpadRecipeSearchGateway>();
        var service = new RecipeDetailsService(gateway.Object);

        var result = await service.GetByRecipeIdAsync("abc", CancellationToken.None);

        result.Status.Should().Be(RecipeDetailsStatus.InvalidRecipeId);
        gateway.Verify(searchGateway => searchGateway.GetByRecipeIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetByRecipeIdAsync_WhenGatewayReturnsDetails_ReturnsSuccessPayload()
    {
        var gateway = new Mock<ICookpadRecipeSearchGateway>();
        gateway
            .Setup(searchGateway => searchGateway.GetByRecipeIdAsync("123", It.IsAny<CancellationToken>()))
            .ReturnsAsync(CookpadRecipeDetailsResult.Success(
                new CookpadRecipeDetails("123", "Creamy Pasta", "https://cookpad.com/eng/recipes/123", null, null, ["pasta"], ["Boil pasta"])));

        var service = new RecipeDetailsService(gateway.Object);

        var result = await service.GetByRecipeIdAsync("123", CancellationToken.None);

        result.Status.Should().Be(RecipeDetailsStatus.Success);
        result.Response.Should().NotBeNull();
        result.Response!.MethodSteps.Should().Equal("Boil pasta");
    }
}
