using CookingInspiration.Server.controllers;
using CookingInspiration.Server.services;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace CookingInspiration.Server.Tests.recipes;

public sealed class RecipesControllerTests
{
    [Fact]
    public async Task Search_WhenServiceReturnsRecipes_ReturnsOkWithPayload()
    {
        var searchService = new Mock<IRecipeSearchService>();
        var expectedResponse = new RecipeSearchResponse(
        [
            new RecipeSearchRecipe("Creamy Pasta", "https://cookpad.com/eng/recipes/1", "https://images/1.jpg", "Rich and simple.", ["200g pasta", "1 cup cream"])
        ]);

        searchService
            .Setup(service => service.SearchAsync("pasta", It.IsAny<CancellationToken>()))
            .ReturnsAsync(RecipeSearchResult.Success(expectedResponse));

        var controller = new RecipesController(searchService.Object);

        var result = await controller.Search("pasta", CancellationToken.None);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeEquivalentTo(expectedResponse);
    }

    [Fact]
    public async Task Search_WhenServiceRejectsKeyword_ReturnsBadRequestProblemDetails()
    {
        var searchService = new Mock<IRecipeSearchService>();
        searchService
            .Setup(service => service.SearchAsync(" ", It.IsAny<CancellationToken>()))
            .ReturnsAsync(RecipeSearchResult.InvalidKeyword());

        var controller = new RecipesController(searchService.Object);

        var result = await controller.Search(" ", CancellationToken.None);

        var badRequestResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        badRequestResult.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        badRequestResult.Value.Should().BeOfType<ProblemDetails>()
            .Which.Detail.Should().Be("The keyword query parameter is required.");
    }

    [Fact]
    public async Task Search_WhenServiceReportsExternalFailure_ReturnsBadGatewayProblemDetails()
    {
        var searchService = new Mock<IRecipeSearchService>();
        searchService
            .Setup(service => service.SearchAsync("pasta", It.IsAny<CancellationToken>()))
            .ReturnsAsync(RecipeSearchResult.ExternalFailure());

        var controller = new RecipesController(searchService.Object);

        var result = await controller.Search("pasta", CancellationToken.None);

        var badGatewayResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        badGatewayResult.StatusCode.Should().Be(StatusCodes.Status502BadGateway);
        badGatewayResult.Value.Should().BeOfType<ProblemDetails>()
            .Which.Detail.Should().Be("Cookpad recipe search is currently unavailable.");
    }
}
