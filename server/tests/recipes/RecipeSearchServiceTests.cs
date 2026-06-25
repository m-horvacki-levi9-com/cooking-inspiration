using CookingInspiration.Server.infrastructure;
using CookingInspiration.Server.services;
using FluentAssertions;
using Moq;

namespace CookingInspiration.Server.Tests.recipes;

public sealed class RecipeSearchServiceTests
{
    [Fact]
    public async Task SearchAsync_WhenKeywordIsWhitespace_ReturnsInvalidKeywordWithoutCallingGateway()
    {
        var gateway = new Mock<ICookpadRecipeSearchGateway>();
        var service = new RecipeSearchService(gateway.Object, new SequenceRandomValueProvider());

        var result = await service.SearchAsync("   ", CancellationToken.None);

        result.Status.Should().Be(RecipeSearchStatus.InvalidKeyword);
        result.Response.Should().BeNull();
        gateway.Verify(
            searchGateway => searchGateway.SearchAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task SearchAsync_WhenGatewayFails_ReturnsExternalFailure()
    {
        var gateway = new Mock<ICookpadRecipeSearchGateway>();
        gateway
            .Setup(searchGateway => searchGateway.SearchAsync("pasta", It.IsAny<CancellationToken>()))
            .ReturnsAsync(CookpadRecipeSearchResult.Failure());

        var service = new RecipeSearchService(gateway.Object, new SequenceRandomValueProvider());

        var result = await service.SearchAsync("pasta", CancellationToken.None);

        result.Status.Should().Be(RecipeSearchStatus.ExternalFailure);
        result.Response.Should().BeNull();
    }

    [Fact]
    public async Task SearchAsync_WhenGatewayReturnsMoreThanFourRecipes_SelectsFourUsingRandomOrdering()
    {
        var gateway = new Mock<ICookpadRecipeSearchGateway>();
        gateway
            .Setup(searchGateway => searchGateway.SearchAsync("pasta", It.IsAny<CancellationToken>()))
            .ReturnsAsync(CookpadRecipeSearchResult.Success(
            [
                new CookpadRecipeCandidate("1", "Recipe 1", "https://cookpad.com/eng/recipes/1", "https://images/1.jpg", "Description 1"),
                new CookpadRecipeCandidate("2", "Recipe 2", "https://cookpad.com/eng/recipes/2", "https://images/2.jpg", "Description 2"),
                new CookpadRecipeCandidate("3", "Recipe 3", "https://cookpad.com/eng/recipes/3", "https://images/3.jpg", "Description 3"),
                new CookpadRecipeCandidate("4", "Recipe 4", "https://cookpad.com/eng/recipes/4", "https://images/4.jpg", "Description 4"),
                new CookpadRecipeCandidate("5", "Recipe 5", "https://cookpad.com/eng/recipes/5", "https://images/5.jpg", "Description 5")
            ]));

        var service = new RecipeSearchService(gateway.Object, new SequenceRandomValueProvider(50, 10, 40, 20, 30));

        var result = await service.SearchAsync("pasta", CancellationToken.None);

        result.Status.Should().Be(RecipeSearchStatus.Success);
        result.Response.Should().NotBeNull();
        result.Response!.Recipes.Should().HaveCount(4);
        result.Response.Recipes.Select(recipe => recipe.Title).Should().ContainInOrder("Recipe 2", "Recipe 4", "Recipe 5", "Recipe 3");
        result.Response.Recipes.Select(recipe => recipe.RecipeId).Should().ContainInOrder("2", "4", "5", "3");
    }

    [Fact]
    public async Task SearchAsync_WhenGatewayReturnsFewerThanFourRecipes_ReturnsAllAvailableRecipes()
    {
        var gateway = new Mock<ICookpadRecipeSearchGateway>();
        gateway
            .Setup(searchGateway => searchGateway.SearchAsync("soup", It.IsAny<CancellationToken>()))
            .ReturnsAsync(CookpadRecipeSearchResult.Success(
            [
                new CookpadRecipeCandidate("1", "Recipe 1", "https://cookpad.com/eng/recipes/1", null, null),
                new CookpadRecipeCandidate("2", "Recipe 2", "https://cookpad.com/eng/recipes/2", "https://images/2.jpg", "Description 2")
            ]));

        var service = new RecipeSearchService(gateway.Object, new SequenceRandomValueProvider(10, 20));

        var result = await service.SearchAsync("soup", CancellationToken.None);

        result.Status.Should().Be(RecipeSearchStatus.Success);
        result.Response.Should().NotBeNull();
        result.Response!.Recipes.Should().HaveCount(2);
        result.Response.Recipes.Select(recipe => recipe.CookpadUrl)
            .Should()
            .Equal("https://cookpad.com/eng/recipes/1", "https://cookpad.com/eng/recipes/2");
    }

    [Fact]
    public async Task SearchAsync_WhenGatewayReturnsNoRecipes_ReturnsSuccessfulEmptyPayload()
    {
        var gateway = new Mock<ICookpadRecipeSearchGateway>();
        gateway
            .Setup(searchGateway => searchGateway.SearchAsync("unknown", It.IsAny<CancellationToken>()))
            .ReturnsAsync(CookpadRecipeSearchResult.Success([]));

        var service = new RecipeSearchService(gateway.Object, new SequenceRandomValueProvider());

        var result = await service.SearchAsync("unknown", CancellationToken.None);

        result.Status.Should().Be(RecipeSearchStatus.Success);
        result.Response.Should().NotBeNull();
        result.Response!.Recipes.Should().BeEmpty();
    }

    private sealed class SequenceRandomValueProvider(params int[] values) : IRandomValueProvider
    {
        private readonly Queue<int> _values = new(values);

        public int Next()
        {
            return _values.Count > 0 ? _values.Dequeue() : 0;
        }
    }
}
