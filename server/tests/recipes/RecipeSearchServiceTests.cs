using CookingInspiration.Server.domain;
using CookingInspiration.Server.services;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace CookingInspiration.Server.Tests.recipes;

public sealed class RecipeSearchServiceTests
{
    [Fact]
    public async Task GivenKeywordIsWhitespace_WhenSearchingRecipes_ThenReturnsInvalidKeywordWithoutCallingRepository()
    {
        // Arrange
        var repository = new Mock<IRecipeRepository>();
        var service = new RecipeSearchService(CreateFactory(repository), NullLogger<RecipeSearchService>.Instance);

        // Act
        var result = await service.SearchAsync("   ", "cookpad", CancellationToken.None);

        // Assert
        result.Status.Should().Be(RecipeSearchStatus.InvalidKeyword);
        result.Response.Should().BeNull();
        repository.Verify(
            r => r.SearchSummariesAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GivenRepositoryReturnsEmptyList_WhenSearchingRecipes_ThenReturnsExternalFailure()
    {
        // Arrange
        var repository = new Mock<IRecipeRepository>();
        repository
            .Setup(r => r.SearchSummariesAsync("pasta", It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        var service = new RecipeSearchService(CreateFactory(repository), NullLogger<RecipeSearchService>.Instance);

    // Act
        var result = await service.SearchAsync("pasta", "cookpad", CancellationToken.None);

    // Assert
        result.Status.Should().Be(RecipeSearchStatus.ExternalFailure);
        result.Response.Should().BeNull();
    }

    [Fact]
    public async Task GivenRepositoryReturnsRecipes_WhenSearchingRecipes_ThenReturnsSuccessPayload()
    {
        // Arrange
        var repository = new Mock<IRecipeRepository>();
        repository
            .Setup(r => r.SearchSummariesAsync("pasta", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RecipeSummary("1", "Recipe 1", "https://cookpad.com/eng/recipes/1", "https://images/1.jpg", "Description 1"),
                new RecipeSummary("2", "Recipe 2", "https://cookpad.com/eng/recipes/2", "https://images/2.jpg", "Description 2"),
                new RecipeSummary("3", "Recipe 3", "https://cookpad.com/eng/recipes/3", "https://images/3.jpg", "Description 3"),
                new RecipeSummary("4", "Recipe 4", "https://cookpad.com/eng/recipes/4", "https://images/4.jpg", "Description 4")
            ]);

        var service = new RecipeSearchService(CreateFactory(repository), NullLogger<RecipeSearchService>.Instance);

    // Act
        var result = await service.SearchAsync("pasta", "cookpad", CancellationToken.None);

    // Assert
        result.Status.Should().Be(RecipeSearchStatus.Success);
        result.Response.Should().NotBeNull();
        result.Response!.Recipes.Should().HaveCount(4);
    }

    [Fact]
    public async Task GivenRepositoryReturnsTwoRecipes_WhenSearchingRecipes_ThenReturnsSuccessPayloadWithBoth()
    {
        // Arrange
        var repository = new Mock<IRecipeRepository>();
        repository
            .Setup(r => r.SearchSummariesAsync("soup", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RecipeSummary("1", "Recipe 1", "https://cookpad.com/eng/recipes/1", null, null),
                new RecipeSummary("2", "Recipe 2", "https://cookpad.com/eng/recipes/2", "https://images/2.jpg", "Description 2")
            ]);

        var service = new RecipeSearchService(CreateFactory(repository), NullLogger<RecipeSearchService>.Instance);

    // Act
        var result = await service.SearchAsync("soup", "cookpad", CancellationToken.None);

    // Assert
        result.Status.Should().Be(RecipeSearchStatus.Success);
        result.Response.Should().NotBeNull();
        result.Response!.Recipes.Should().HaveCount(2);
        result.Response.Recipes.Select(recipe => recipe.CookpadUrl)
            .Should()
            .Equal("https://cookpad.com/eng/recipes/1", "https://cookpad.com/eng/recipes/2");
    }

    [Fact]
    public async Task GivenRepositoryReturnsNoRecipes_WhenSearchingRecipes_ThenReturnsExternalFailure()
    {
        // Arrange
        var repository = new Mock<IRecipeRepository>();
        repository
            .Setup(r => r.SearchSummariesAsync("unknown", It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        var service = new RecipeSearchService(CreateFactory(repository), NullLogger<RecipeSearchService>.Instance);

    // Act
        var result = await service.SearchAsync("unknown", "cookpad", CancellationToken.None);

    // Assert
        result.Status.Should().Be(RecipeSearchStatus.ExternalFailure);
        result.Response.Should().BeNull();
    }

    [Fact]
    public async Task GivenRepositoryThrowsException_WhenSearchingRecipes_ThenReturnsExternalFailure()
    {
        // Arrange
        var repository = new Mock<IRecipeRepository>();
        repository
            .Setup(r => r.SearchSummariesAsync("error", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("Network error"));

        var service = new RecipeSearchService(CreateFactory(repository), NullLogger<RecipeSearchService>.Instance);

        // Act
        var result = await service.SearchAsync("error", "cookpad", CancellationToken.None);

        // Assert
        result.Status.Should().Be(RecipeSearchStatus.ExternalFailure);
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

