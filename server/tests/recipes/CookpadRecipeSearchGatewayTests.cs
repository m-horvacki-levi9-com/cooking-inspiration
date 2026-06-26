using System.Net;
using CookingInspiration.Server.domain;
using CookingInspiration.Server.infrastructure;
using CookingInspiration.Server.infrastructure.Cookpad;
using FluentAssertions;

namespace CookingInspiration.Server.Tests.recipes;

public sealed class CookpadRecipeRepositoryTests
{
    [Fact]
    public async Task SearchSummariesAsync_UsesCookpadEnglishSearchPath()
    {
        string? requestedPath = null;
        using var httpClient = new HttpClient(new StubHttpMessageHandler(request =>
        {
            requestedPath = request.RequestUri?.AbsolutePath;
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("<html><body>No recipes found.</body></html>")
            };
        }))
        {
            BaseAddress = new Uri("https://cookpad.com")
        };

        var repository = new CookpadRecipeRepository(httpClient, new StableRandomValueProvider());

        await repository.SearchSummariesAsync("pasta", CancellationToken.None);

        requestedPath.Should().Be("/eng/search/pasta");
    }

    [Fact]
    public async Task SearchSummariesAsync_WhenResponseContainsValidRecipeSummaries_ReturnsCompactRecipesWithoutIngredients()
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
                    </main>
                  </body>
                </html>
                """)
        }))
        {
            BaseAddress = new Uri("https://cookpad.com")
        };

        var repository = new CookpadRecipeRepository(httpClient, new StableRandomValueProvider());

        var result = await repository.SearchSummariesAsync("pasta", CancellationToken.None);

        result.Should().BeEquivalentTo(
        [
           new RecipeSummary("11111", "Creamy Pasta", "https://cookpad.com/eng/recipes/11111", "https://images/1.jpg", "Rich and simple."),
           new RecipeSummary("22222", "Tomato Soup", "https://cookpad.com/eng/recipes/22222", "https://images/2.jpg", "Comfort in a bowl.")
        ]);
    }

    [Fact]
    public async Task SearchSummariesAsync_WhenRecipeUrlContainsMeSegmentOnly_NormalizesItToCleanRecipeUrl()
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

        var repository = new CookpadRecipeRepository(httpClient, new StableRandomValueProvider());

        var result = await repository.SearchSummariesAsync("pasta", CancellationToken.None);

        result.Should().ContainSingle();
        result.Single().CookpadUrl.Should().Be("https://cookpad.com/eng/recipes/55555");
    }

    [Fact]
    public async Task GetRecipeCardAsync_WhenJsonLdContainsRecipeInstructions_ReturnsStructuredSteps()
    {
        string? requestedPath = null;
        using var httpClient = new HttpClient(new StubHttpMessageHandler(request =>
        {
            requestedPath = request.RequestUri?.AbsolutePath;
            if (request.RequestUri?.AbsolutePath.Equals("/eng/recipes/11111", StringComparison.OrdinalIgnoreCase) == true)
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        """
                        <html>
                          <head>
                            <script type="application/ld+json">
                              {
                                "@context":"https://schema.org",
                                "@type":"Recipe",
                                "name":"Golden Potatoes",
                                "description":"Crispy pan-fried potatoes.",
                                "image":["https://images.example.com/potato.jpg"],
                                "recipeIngredient":["3 potatoes","olive oil","salt"],
                                "recipeInstructions":[
                                  {"@type":"HowToStep","text":"Slice potatoes"},
                                  {"@type":"HowToStep","text":"Pan fry until golden"}
                                ]
                              }
                            </script>
                          </head>
                          <body></body>
                        </html>
                        """)
                };
            }

            return new HttpResponseMessage(HttpStatusCode.NotFound);
        }))
        {
            BaseAddress = new Uri("https://cookpad.com")
        };

        var repository = new CookpadRecipeRepository(httpClient, new StableRandomValueProvider());

        var result = await repository.GetRecipeCardAsync("11111", CancellationToken.None);

        result.Should().NotBeNull();
        result!.MethodSteps.Should().Equal("Slice potatoes", "Pan fry until golden");
        result.CookpadUrl.Should().Be("https://cookpad.com/eng/recipes/11111");
        requestedPath.Should().Be("/eng/recipes/11111");
    }

    [Fact]
    public async Task GetRecipeCardAsync_WhenJsonLdHasNoSteps_ParsesStepsFromHtmlFallback()
    {
        using var httpClient = new HttpClient(new StubHttpMessageHandler(request =>
        {
            if (request.RequestUri?.AbsolutePath.Equals("/eng/recipes/11111", StringComparison.OrdinalIgnoreCase) == true)
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        """
                        <html>
                          <head>
                            <meta property="og:title" content="Golden Potatoes"/>
                            <meta property="og:url" content="https://cookpad.com/eng/recipes/11111"/>
                          </head>
                          <body>
                            <ul>
                              <li>3 potatoes</li>
                              <li>olive oil</li>
                            </ul>
                            <h2>Method</h2>
                            <ol>
                              <li>Slice potatoes</li>
                              <li>Pan fry until golden</li>
                            </ol>
                          </body>
                        </html>
                        """)
                };
            }

            return new HttpResponseMessage(HttpStatusCode.NotFound);
        }))
        {
            BaseAddress = new Uri("https://cookpad.com")
        };

        var repository = new CookpadRecipeRepository(httpClient, new StableRandomValueProvider());

        var result = await repository.GetRecipeCardAsync("11111", CancellationToken.None);

        result.Should().NotBeNull();
        result!.MethodSteps.Should().Equal("Slice potatoes", "Pan fry until golden");
    }

    [Fact]
    public async Task GetRecipeCardAsync_WhenStepsAreMissing_ReturnsSuccessWithEmptyMethodSteps()
    {
        using var httpClient = new HttpClient(new StubHttpMessageHandler(request =>
        {
            if (request.RequestUri?.AbsolutePath.Equals("/eng/recipes/11111", StringComparison.OrdinalIgnoreCase) == true)
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        """
                        <html>
                          <head>
                            <meta property="og:title" content="Golden Potatoes"/>
                          </head>
                          <body>
                            <ul>
                              <li>3 potatoes</li>
                            </ul>
                          </body>
                        </html>
                        """)
                };
            }

            return new HttpResponseMessage(HttpStatusCode.NotFound);
        }))
        {
            BaseAddress = new Uri("https://cookpad.com")
        };

        var repository = new CookpadRecipeRepository(httpClient, new StableRandomValueProvider());

        var result = await repository.GetRecipeCardAsync("11111", CancellationToken.None);

        result.Should().NotBeNull();
        result!.MethodSteps.Should().BeEmpty();
    }

    private sealed class StableRandomValueProvider : IRandomValueProvider
    {
        public int Next()
        {
            return 0;
        }
    }

    private sealed class StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responseFactory) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(responseFactory(request));
        }
    }
}
