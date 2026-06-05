using System.Net;
using System.Net.Http.Json;
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
                new CookpadRecipeCandidate("Recipe 1", "https://cookpad.com/eng/recipes/1", "https://images/1.jpg", "Description 1", ["Ingredient 1"]),
                new CookpadRecipeCandidate("Recipe 2", "https://cookpad.com/eng/recipes/2", "https://images/2.jpg", "Description 2", ["Ingredient 2"]),
                new CookpadRecipeCandidate("Recipe 3", "https://cookpad.com/eng/recipes/3", null, null, []),
                new CookpadRecipeCandidate("Recipe 4", "https://cookpad.com/eng/recipes/4", "https://images/4.jpg", "Description 4", ["Ingredient 4"]),
                new CookpadRecipeCandidate("Recipe 5", "https://cookpad.com/eng/recipes/5", "https://images/5.jpg", "Description 5", ["Ingredient 5"])
            ]),
            new SequenceRandomValueProvider(50, 10, 40, 20, 30));

        var response = await client.GetAsync("/api/recipes/search?keyword=pasta");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<RecipeSearchResponse>();
        payload.Should().NotBeNull();
        payload!.Recipes.Select(recipe => recipe.Title).Should().ContainInOrder("Recipe 2", "Recipe 4", "Recipe 5", "Recipe 3");
        payload.Recipes.Select(recipe => recipe.Ingredients)
            .Should()
            .BeEquivalentTo(new[] { ["Ingredient 2"], ["Ingredient 4"], ["Ingredient 5"], Array.Empty<string>() }, options => options.WithStrictOrdering());
    }

    [Fact]
    public async Task GetSearch_WhenKeywordIsWhitespace_ReturnsBadRequest()
    {
        using var client = CreateClient(CookpadRecipeSearchResult.Success([]), new SequenceRandomValueProvider());

        var response = await client.GetAsync("/api/recipes/search?keyword=%20%20%20");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var payload = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        payload.Should().NotBeNull();
        payload!.Detail.Should().Be("The keyword query parameter is required.");
    }

    [Fact]
    public async Task GetSearch_WhenExternalSearchFails_ReturnsBadGateway()
    {
        using var client = CreateClient(CookpadRecipeSearchResult.Failure(), new SequenceRandomValueProvider());

        var response = await client.GetAsync("/api/recipes/search?keyword=pasta");

        response.StatusCode.Should().Be(HttpStatusCode.BadGateway);
        var payload = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        payload.Should().NotBeNull();
        payload!.Detail.Should().Be("Cookpad recipe search is currently unavailable.");
    }

    private HttpClient CreateClient(CookpadRecipeSearchResult searchResult, IRandomValueProvider randomValueProvider)
    {
        return _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<ICookpadRecipeSearchGateway>();
                services.RemoveAll<IRandomValueProvider>();

                services.AddSingleton<ICookpadRecipeSearchGateway>(new StubCookpadRecipeSearchGateway(searchResult));
                services.AddSingleton(randomValueProvider);
            });
        }).CreateClient();
    }

    private sealed class StubCookpadRecipeSearchGateway(CookpadRecipeSearchResult searchResult) : ICookpadRecipeSearchGateway
    {
        public Task<CookpadRecipeSearchResult> SearchAsync(string keyword, CancellationToken cancellationToken)
        {
            return Task.FromResult(searchResult);
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
