using System.Net;
using CookingInspiration.Server.infrastructure;
using CookingInspiration.Server.services;
using FluentAssertions;

namespace CookingInspiration.Server.Tests.recipes;

public sealed class CookpadRecipeSearchGatewayTests
{
    [Fact]
    public async Task SearchAsync_WhenResponseContainsValidRecipeCards_ReturnsParsedRecipes()
    {
        using var httpClient = new HttpClient(new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(
                """
                <html>
                  <body>
                    <main>
                      <a href="/eng/recipes/11111">
                        <article>
                          <img src="https://images/1.jpg" alt="Creamy Pasta" />
                          <h2>Creamy Pasta</h2>
                          <p>Rich and simple.</p>
                        </article>
                      </a>
                      <a href="/eng/recipes/22222">
                        <article>
                          <img data-src="https://images/2.jpg" alt="Tomato Soup" />
                          <h3>Tomato Soup</h3>
                          <p>Comfort in a bowl.</p>
                        </article>
                      </a>
                      <a href="/eng/recipes/33333">
                        <article>
                          <p>Missing title</p>
                        </article>
                      </a>
                    </main>
                  </body>
                </html>
                """)
        }))
        {
            BaseAddress = new Uri("https://cookpad.com")
        };

        var gateway = new CookpadRecipeSearchGateway(httpClient);

        var result = await gateway.SearchAsync("pasta", CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Recipes.Should().HaveCount(2);
        result.Recipes.Should().BeEquivalentTo(
        [
            new CookpadRecipeCandidate("Creamy Pasta", "https://cookpad.com/eng/recipes/11111", "https://images/1.jpg", "Rich and simple."),
            new CookpadRecipeCandidate("Tomato Soup", "https://cookpad.com/eng/recipes/22222", "https://images/2.jpg", "Comfort in a bowl.")
        ]);
    }

    [Fact]
    public async Task SearchAsync_WhenResponseContainsBookmarkProfileUrls_NormalizesThemToCleanRecipeUrls()
    {
        using var httpClient = new HttpClient(new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(
                """
                <html>
                  <body>
                    <main>
                      <a href="/us/me/recipes/25374380/bookmark_folders">
                        <article>
                          <img src="https://images/bm.jpg" alt="Bookmark Recipe" />
                          <h2>Bookmark Recipe</h2>
                          <p>From bookmarks.</p>
                        </article>
                      </a>
                      <a href="/us/recipes/99999">
                        <article>
                          <img src="https://images/valid.jpg" alt="Valid Recipe" />
                          <h2>Valid Recipe</h2>
                          <p>Clean URL.</p>
                        </article>
                      </a>
                    </main>
                  </body>
                </html>
                """)
        }))
        {
            BaseAddress = new Uri("https://cookpad.com")
        };

        var gateway = new CookpadRecipeSearchGateway(httpClient);

        var result = await gateway.SearchAsync("pasta", CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Recipes.Should().HaveCount(2);
        result.Recipes.Should().BeEquivalentTo(
        [
            new CookpadRecipeCandidate("Bookmark Recipe", "https://cookpad.com/us/recipes/25374380", "https://images/bm.jpg", "From bookmarks."),
            new CookpadRecipeCandidate("Valid Recipe", "https://cookpad.com/us/recipes/99999", "https://images/valid.jpg", "Clean URL.")
        ]);
    }

    [Fact]
    public async Task SearchAsync_WhenRecipeUrlContainsMeSegmentOnly_NormalizesItToCleanRecipeUrl()
    {
        using var httpClient = new HttpClient(new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(
                """
                <html>
                  <body>
                    <main>
                      <a href="/eng/me/recipes/55555">
                        <article>
                          <img src="https://images/me.jpg" alt="Me Recipe" />
                          <h2>Me Recipe</h2>
                          <p>Profile recipe URL.</p>
                        </article>
                      </a>
                    </main>
                  </body>
                </html>
                """)
        }))
        {
            BaseAddress = new Uri("https://cookpad.com")
        };

        var gateway = new CookpadRecipeSearchGateway(httpClient);

        var result = await gateway.SearchAsync("pasta", CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Recipes.Should().HaveCount(1);
        result.Recipes.Single().CookpadUrl.Should().Be("https://cookpad.com/eng/recipes/55555");
    }

    [Fact]
    public async Task SearchAsync_WhenResponseContainsNoResultsMarker_ReturnsSuccessfulEmptyResult()
    {
        using var httpClient = new HttpClient(new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("<html><body><p>No recipes found for your search.</p></body></html>")
        }))
        {
            BaseAddress = new Uri("https://cookpad.com")
        };

        var gateway = new CookpadRecipeSearchGateway(httpClient);

        var result = await gateway.SearchAsync("unknown", CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Recipes.Should().BeEmpty();
    }

    [Fact]
    public async Task SearchAsync_WhenResponseIsAntiBotChallenge_ReturnsFailure()
    {
        using var httpClient = new HttpClient(new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("<html><head><title>Client Challenge</title></head><body></body></html>")
        }))
        {
            BaseAddress = new Uri("https://cookpad.com")
        };

        var gateway = new CookpadRecipeSearchGateway(httpClient);

        var result = await gateway.SearchAsync("pasta", CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Recipes.Should().BeEmpty();
    }

    [Fact]
    public async Task SearchAsync_WhenCookpadReturnsHttpFailure_ReturnsFailure()
    {
        using var httpClient = new HttpClient(new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.BadGateway)))
        {
            BaseAddress = new Uri("https://cookpad.com")
        };

        var gateway = new CookpadRecipeSearchGateway(httpClient);

        var result = await gateway.SearchAsync("pasta", CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }

    private sealed class StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responseFactory) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(responseFactory(request));
        }
    }
}
