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
                          <ul>
                            <li>200g pasta</li>
                            <li>1 cup cream</li>
                          </ul>
                        </article>
                      </a>
                      <a href="/eng/recipes/22222">
                        <article>
                          <img data-src="https://images/2.jpg" alt="Tomato Soup" />
                          <h3>Tomato Soup</h3>
                          <p>Comfort in a bowl.</p>
                          <ul>
                            <li>4 tomatoes</li>
                            <li>1 onion</li>
                          </ul>
                        </article>
                      </a>
                      <a href="/eng/posts/33333">
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
           new CookpadRecipeCandidate("Creamy Pasta", "https://cookpad.com/eng/recipes/11111", "https://images/1.jpg", "Rich and simple.", ["200g pasta", "1 cup cream"]),
           new CookpadRecipeCandidate("Tomato Soup", "https://cookpad.com/eng/recipes/22222", "https://images/2.jpg", "Comfort in a bowl.", ["4 tomatoes", "1 onion"])
        ]);
    }

    [Fact]
    public async Task SearchAsync_WhenRecipeCardOmitsIngredients_ReturnsEmptyIngredientList()
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
       result.Recipes.Should().ContainSingle();
       result.Recipes.Single().Ingredients.Should().BeEmpty();
    }

    [Fact]
    public async Task SearchAsync_WhenRecipeCardContentIsOutsideLink_ParsesImageDescriptionAndIngredients()
    {
       using var httpClient = new HttpClient(new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
       {
           Content = new StringContent(
               """
               <html>
                 <body>
                   <main>
                     <article>
                       <a href="/eng/recipes/11111">
                         <h2>Creamy Pasta</h2>
                       </a>
                       <img srcset="https://images/1-small.jpg 320w, https://images/1-large.jpg 640w" alt="Creamy Pasta" />
                       <p>Rich and simple.</p>
                       <div data-ingredients-redesign-target="ingredients">
                         200g pasta <span>•</span> 1 cup cream
                       </div>
                     </article>
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
       result.Recipes.Should().ContainSingle();
       result.Recipes.Single().ImageUrl.Should().Be("https://images/1-small.jpg");
       result.Recipes.Single().Description.Should().Be("Rich and simple.");
       result.Recipes.Single().Ingredients.Should().Equal("200g pasta", "1 cup cream");
    }

    [Fact]
    public async Task SearchAsync_WhenSearchCardMissesFields_EnrichesThemFromRecipeDetailsPage()
    {
       using var httpClient = new HttpClient(new StubHttpMessageHandler(request =>
       {
           if (request.RequestUri?.AbsolutePath.Equals("/eng/search/potato", StringComparison.OrdinalIgnoreCase) == true)
           {
               return new HttpResponseMessage(HttpStatusCode.OK)
               {
                   Content = new StringContent(
                       """
                       <html>
                         <body>
                           <main>
                             <article>
                               <a href="/eng/recipes/11111"></a>
                             </article>
                           </main>
                         </body>
                       </html>
                       """)
               };
           }

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
                               "recipeIngredient":["3 potatoes","olive oil","salt"]
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

       var gateway = new CookpadRecipeSearchGateway(httpClient);

       var result = await gateway.SearchAsync("potato", CancellationToken.None);

       result.IsSuccess.Should().BeTrue();
       result.Recipes.Should().ContainSingle();
       result.Recipes.Single().Title.Should().Be("Golden Potatoes");
       result.Recipes.Single().ImageUrl.Should().Be("https://images.example.com/potato.jpg");
       result.Recipes.Single().Description.Should().Be("Crispy pan-fried potatoes.");
       result.Recipes.Single().Ingredients.Should().Equal("3 potatoes", "olive oil", "salt");
    }

    [Fact]
    public async Task SearchAsync_WhenRecipeCardUsesRedesignedIngredientsContainer_ReturnsSeparatedIngredients()
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
                         <div data-ingredients-redesign-target="ingredients">
                           <div class="line-clamp-2 break-words">
                             200g pasta
                             <span>•</span>
                             1 cup cream
                             <span>•</span>
                             salt
                           </div>
                         </div>
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
       result.Recipes.Should().ContainSingle();
       result.Recipes.Single().Ingredients.Should().Equal("200g pasta", "1 cup cream", "salt");
    }

    [Fact]
    public async Task SearchAsync_WhenRedesignedIngredientsContainerIsEmpty_ReturnsEmptyIngredientList()
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
                         <div data-ingredients-redesign-target="ingredients">
                           <div class="line-clamp-2 break-words">
                             <span>•</span>
                           </div>
                         </div>
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
       result.Recipes.Should().ContainSingle();
       result.Recipes.Single().Ingredients.Should().BeEmpty();
    }

    [Fact]
    public async Task SearchAsync_WhenResponseContainsBookmarkAndCreateRecipeUrls_IgnoresThem()
    {
        using var httpClient = new HttpClient(new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(
                """
                <html>
                  <body>
                    <main>
                      <a href="/us/recipes/new">
                        <span>Create recipe</span>
                      </a>
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
          result.Recipes.Should().HaveCount(1);
        result.Recipes.Should().BeEquivalentTo(
        [
           new CookpadRecipeCandidate("Valid Recipe", "https://cookpad.com/us/recipes/99999", "https://images/valid.jpg", "Clean URL.", [])
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
