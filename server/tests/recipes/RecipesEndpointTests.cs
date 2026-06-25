using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using CookingInspiration.Server.infrastructure;
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
    public async Task GetSearch_WhenRecipesAreFound_ReturnsFrontendFriendlyPayload()
    {
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

        var response = await client.GetAsync("/api/recipes/search?keyword=pasta");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();
        payload.GetProperty("recipes").EnumerateArray().Select(recipe => recipe.GetProperty("title").GetString()).Should().ContainInOrder("Recipe 2", "Recipe 4", "Recipe 5", "Recipe 3");
        payload.GetProperty("recipes").EnumerateArray().All(recipe => !recipe.TryGetProperty("ingredients", out _)).Should().BeTrue();
        payload.GetProperty("recipes").EnumerateArray().All(recipe => !recipe.TryGetProperty("methodSteps", out _)).Should().BeTrue();
    }

    [Fact]
    public async Task GetSearch_WhenKeywordIsWhitespace_ReturnsBadRequest()
    {
        using var client = CreateClient(CookpadRecipeSearchResult.Success([]), CookpadRecipeDetailsResult.Failure(), new SequenceRandomValueProvider());

        var response = await client.GetAsync("/api/recipes/search?keyword=%20%20%20");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var payload = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        payload.Should().NotBeNull();
        payload!.Detail.Should().Be("The keyword query parameter is required.");
    }

    [Fact]
    public async Task GetSearch_WhenExternalSearchFails_ReturnsBadGateway()
    {
        using var client = CreateClient(CookpadRecipeSearchResult.Failure(), CookpadRecipeDetailsResult.Failure(), new SequenceRandomValueProvider());

        var response = await client.GetAsync("/api/recipes/search?keyword=pasta");

        response.StatusCode.Should().Be(HttpStatusCode.BadGateway);
        var payload = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        payload.Should().NotBeNull();
        payload!.Detail.Should().Be("Cookpad recipe search is currently unavailable.");
    }

    [Fact]
    public async Task GetDetails_WhenRecipeExists_ReturnsDetailedPayload()
    {
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

        var response = await client.GetAsync("/api/recipes/123");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<RecipeDetailsResponse>();
        payload.Should().NotBeNull();
        payload!.CookpadUrl.Should().Be("https://cookpad.com/eng/recipes/123");
        payload.MethodSteps.Should().Equal("Boil pasta", "Mix cream");
    }

    [Fact]
    public async Task GetDetails_WhenMethodStepsAreMissing_ReturnsSuccessfulPayloadWithEmptySteps()
    {
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

        var response = await client.GetAsync("/api/recipes/123");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<RecipeDetailsResponse>();
        payload.Should().NotBeNull();
        payload!.MethodSteps.Should().BeEmpty();
    }

    private HttpClient CreateClient(CookpadRecipeSearchResult searchResult, CookpadRecipeDetailsResult detailsResult, IRandomValueProvider randomValueProvider)
    {
        return _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<ICookpadRecipeSearchGateway>();
                services.RemoveAll<IRandomValueProvider>();

                services.AddSingleton<ICookpadRecipeSearchGateway>(new StubCookpadRecipeSearchGateway(searchResult, detailsResult));
                services.AddSingleton(randomValueProvider);
            });
        }).CreateClient();
    }

    private sealed class StubCookpadRecipeSearchGateway(CookpadRecipeSearchResult searchResult, CookpadRecipeDetailsResult detailsResult) : ICookpadRecipeSearchGateway
    {
        public Task<CookpadRecipeSearchResult> SearchAsync(string keyword, CancellationToken cancellationToken)
        {
            return Task.FromResult(searchResult);
        }

        public Task<CookpadRecipeDetailsResult> GetByRecipeIdAsync(string recipeId, CancellationToken cancellationToken)
        {
            return Task.FromResult(detailsResult);
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
