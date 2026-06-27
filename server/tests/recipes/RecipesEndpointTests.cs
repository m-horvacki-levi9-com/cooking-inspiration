using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using CookingInspiration.Server.domain;
using CookingInspiration.Server.infrastructure;
using CookingInspiration.Server.infrastructure.Cookpad;
using CookingInspiration.Server.services;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace CookingInspiration.Server.Tests.recipes;

public sealed class RecipesEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public RecipesEndpointTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GivenRecipesAreFound_WhenSearchEndpointIsCalled_ThenReturnsFrontendFriendlyPayload()
    {
        // Arrange
        using var client = CreateClient(
            CookpadRecipeSearchResult.Success(
            [
                new CookpadRecipeCandidate("1", "Recipe 1", "https://cookpad.com/eng/recipes/1", "https://images/1.jpg", "Description 1"),
                new CookpadRecipeCandidate("2", "Recipe 2", "https://cookpad.com/eng/recipes/2", "https://images/2.jpg", "Description 2"),
                new CookpadRecipeCandidate("3", "Recipe 3", "https://cookpad.com/eng/recipes/3", null, null),
                new CookpadRecipeCandidate("4", "Recipe 4", "https://cookpad.com/eng/recipes/4", "https://images/4.jpg", "Description 4"),
                new CookpadRecipeCandidate("5", "Recipe 5", "https://cookpad.com/eng/recipes/5", "https://images/5.jpg", "Description 5")
            ]),
            CookpadRecipeDetailsResult.Failure(),
            new SequenceRandomValueProvider(50, 10, 40, 20, 30));

        // Act
        var response = await client.GetAsync("/api/recipes/search?keyword=pasta");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();
        payload.GetProperty("recipes").EnumerateArray().Select(recipe => recipe.GetProperty("title").GetString()).Should().ContainInOrder("Recipe 2", "Recipe 4", "Recipe 5", "Recipe 3");
        payload.GetProperty("recipes").EnumerateArray().All(recipe => !recipe.TryGetProperty("ingredients", out _)).Should().BeTrue();
        payload.GetProperty("recipes").EnumerateArray().All(recipe => !recipe.TryGetProperty("methodSteps", out _)).Should().BeTrue();
    }

    [Fact]
    public async Task GivenKeywordIsWhitespace_WhenSearchEndpointIsCalled_ThenReturnsBadRequest()
    {
        // Arrange
        using var client = CreateClient(CookpadRecipeSearchResult.Success([]), CookpadRecipeDetailsResult.Failure(), new SequenceRandomValueProvider());

        // Act
        var response = await client.GetAsync("/api/recipes/search?keyword=%20%20%20");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var payload = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        payload.Should().NotBeNull();
        payload!.Detail.Should().Be("The keyword query parameter is required.");
    }

    [Fact]
    public async Task GivenExternalSearchFails_WhenSearchEndpointIsCalled_ThenReturnsBadGateway()
    {
        // Arrange
        using var client = CreateClient(CookpadRecipeSearchResult.Failure(), CookpadRecipeDetailsResult.Failure(), new SequenceRandomValueProvider());

        // Act
        var response = await client.GetAsync("/api/recipes/search?keyword=pasta");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadGateway);
        var payload = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        payload.Should().NotBeNull();
        payload!.Detail.Should().Be("Cookpad recipe search is currently unavailable.");
    }

    [Fact]
    public async Task GivenRecipeExists_WhenDetailsEndpointIsCalled_ThenReturnsDetailedPayload()
    {
        // Arrange
        using var client = CreateClient(
            CookpadRecipeSearchResult.Success([]),
            CookpadRecipeDetailsResult.Success(
                new CookpadRecipeDetails(
                    "123",
                    "Creamy Pasta",
                    "https://cookpad.com/eng/recipes/123",
                    "https://images/123.jpg",
                    "Rich and simple.",
                    ["200g pasta", "1 cup cream"],
                    ["Boil pasta", "Mix cream"])),
            new SequenceRandomValueProvider());

                // Act
        var response = await client.GetAsync("/api/recipes/123");

                // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<RecipeCard>();
        payload.Should().NotBeNull();
        payload!.CookpadUrl.Should().Be("https://cookpad.com/eng/recipes/123");
        payload.MethodSteps.Should().Equal("Boil pasta", "Mix cream");
    }

    [Fact]
    public async Task GivenMethodStepsAreMissing_WhenDetailsEndpointIsCalled_ThenReturnsSuccessfulPayloadWithEmptySteps()
    {
        // Arrange
        using var client = CreateClient(
            CookpadRecipeSearchResult.Success([]),
            CookpadRecipeDetailsResult.Success(
                new CookpadRecipeDetails(
                    "123",
                    "Creamy Pasta",
                    "https://cookpad.com/eng/recipes/123",
                    null,
                    null,
                    ["200g pasta", "1 cup cream"],
                    [])),
            new SequenceRandomValueProvider());

                // Act
        var response = await client.GetAsync("/api/recipes/123");

                // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<RecipeCard>();
        payload.Should().NotBeNull();
        payload!.MethodSteps.Should().BeEmpty();
    }

    private HttpClient CreateClient(CookpadRecipeSearchResult searchResult, CookpadRecipeDetailsResult detailsResult, IRandomValueProvider randomValueProvider)
    {
        return _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IRandomValueProvider>();

                services.AddSingleton(randomValueProvider);
                services.AddKeyedScoped<IRecipeRepository>(
                    RecipeProviders.Cookpad,
                    (provider, _) => new StubRecipeRepository(
                        searchResult,
                        detailsResult,
                        provider.GetRequiredService<IRandomValueProvider>()));
            });
        }).CreateClient();
    }

    private sealed class StubRecipeRepository(
        CookpadRecipeSearchResult searchResult,
        CookpadRecipeDetailsResult detailsResult,
        IRandomValueProvider randomValueProvider) : IRecipeRepository
    {
        public Task<IReadOnlyList<RecipeSummary>> SearchSummariesAsync(string keyword, CancellationToken cancellationToken)
        {
            if (!searchResult.IsSuccess)
            {
                return Task.FromResult<IReadOnlyList<RecipeSummary>>([]);
            }

            var summaries = searchResult.Recipes
                .OrderBy(_ => randomValueProvider.Next())
                .Take(4)
                .Select(recipe => new RecipeSummary(
                    recipe.RecipeId,
                    recipe.Title,
                    recipe.CookpadUrl,
                    recipe.ImageUrl,
                    recipe.Description))
                .ToArray();

            return Task.FromResult<IReadOnlyList<RecipeSummary>>(summaries);
        }

        public Task<RecipeCard?> GetRecipeCardAsync(string recipeId, CancellationToken cancellationToken)
        {
            var card = detailsResult.Status == CookpadRecipeDetailsStatus.Success
                ? new RecipeCard(
                    detailsResult.Details!.RecipeId,
                    detailsResult.Details.Title,
                    detailsResult.Details.CookpadUrl,
                    detailsResult.Details.ImageUrl,
                    detailsResult.Details.Description,
                    detailsResult.Details.Ingredients,
                    detailsResult.Details.MethodSteps)
                : null;

            return Task.FromResult(card);
        }
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
