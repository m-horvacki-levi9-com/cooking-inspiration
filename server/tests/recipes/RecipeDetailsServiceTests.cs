using CookingInspiration.Server.domain;
using CookingInspiration.Server.services;
using FluentAssertions;
using Moq;

namespace CookingInspiration.Server.Tests.recipes;

public sealed class RecipeDetailsServiceTests
{
    [Fact]
    public async Task GetByRecipeIdAsync_WhenRecipeIdIsInvalid_ReturnsInvalidRecipeIdWithoutCallingRepository()
    {
        var repository = new Mock<IRecipeRepository>();
        var service = new RecipeDetailsService(CreateFactory(repository));

        var result = await service.GetByRecipeIdAsync("abc", "cookpad", CancellationToken.None);

        result.Status.Should().Be(RecipeDetailsStatus.InvalidRecipeId);
        repository.Verify(r => r.GetRecipeCardAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetByRecipeIdAsync_WhenRepositoryReturnsRecipeCard_ReturnsSuccessPayload()
    {
        var repository = new Mock<IRecipeRepository>();
        repository
            .Setup(r => r.GetRecipeCardAsync("123", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RecipeCard("123", "Creamy Pasta", "https://cookpad.com/eng/recipes/123", null, null, ["pasta"], ["Boil pasta"]));

        var service = new RecipeDetailsService(CreateFactory(repository));

        var result = await service.GetByRecipeIdAsync("123", "cookpad", CancellationToken.None);

        result.Status.Should().Be(RecipeDetailsStatus.Success);
        result.Response.Should().NotBeNull();
        result.Response!.MethodSteps.Should().Equal("Boil pasta");
    }

    [Fact]
    public async Task GetByRecipeIdAsync_WhenRepositoryReturnsNull_ReturnsNotFound()
    {
        var repository = new Mock<IRecipeRepository>();
        repository
            .Setup(r => r.GetRecipeCardAsync("999", It.IsAny<CancellationToken>()))
            .ReturnsAsync((RecipeCard?)null);

        var service = new RecipeDetailsService(CreateFactory(repository));

        var result = await service.GetByRecipeIdAsync("999", "cookpad", CancellationToken.None);

        result.Status.Should().Be(RecipeDetailsStatus.NotFound);
        result.Response.Should().BeNull();
    }

    private static IRecipeRepositoryFactory CreateFactory(Mock<IRecipeRepository> repository)
    {
        var factory = new Mock<IRecipeRepositoryFactory>();
        factory
            .Setup(f => f.Create(It.IsAny<string?>()))
            .Returns(repository.Object);
        return factory.Object;
    }
}


