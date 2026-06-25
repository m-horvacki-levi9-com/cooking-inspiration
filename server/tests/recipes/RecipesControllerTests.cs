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
            new RecipeSearchRecipe("1", "Creamy Pasta", "https://cookpad.com/eng/recipes/1", "https://images/1.jpg", "Rich and simple.")
        ]);

        searchService
            .Setup(service => service.SearchAsync("pasta", It.IsAny<CancellationToken>()))
            .ReturnsAsync(RecipeSearchResult.Success(expectedResponse));

        var controller = new RecipesController(searchService.Object, Mock.Of<IRecipeDetailsService>());

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

        var controller = new RecipesController(searchService.Object, Mock.Of<IRecipeDetailsService>());

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

        var controller = new RecipesController(searchService.Object, Mock.Of<IRecipeDetailsService>());

        var result = await controller.Search("pasta", CancellationToken.None);

        var badGatewayResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        badGatewayResult.StatusCode.Should().Be(StatusCodes.Status502BadGateway);
        badGatewayResult.Value.Should().BeOfType<ProblemDetails>()
            .Which.Detail.Should().Be("Cookpad recipe search is currently unavailable.");
    }

    [Fact]
    public async Task Details_WhenServiceReturnsRecipe_ReturnsOkWithPayload()
    {
        var detailsService = new Mock<IRecipeDetailsService>();
        var expectedResponse = new RecipeDetailsResponse(
            "1",
            "Creamy Pasta",
            "https://cookpad.com/eng/recipes/1",
            "https://images/1.jpg",
            "Rich and simple.",
            ["200g pasta", "1 cup cream"],
            ["Boil pasta", "Mix cream"]);

        detailsService
            .Setup(service => service.GetByRecipeIdAsync("1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(RecipeDetailsResult.Success(expectedResponse));

        var controller = new RecipesController(Mock.Of<IRecipeSearchService>(), detailsService.Object);

        var result = await controller.Details("1", CancellationToken.None);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeEquivalentTo(expectedResponse);
    }

    [Fact]
    public async Task Details_WhenServiceRejectsRecipeId_ReturnsBadRequestProblemDetails()
    {
        var detailsService = new Mock<IRecipeDetailsService>();
        detailsService
            .Setup(service => service.GetByRecipeIdAsync(" ", It.IsAny<CancellationToken>()))
            .ReturnsAsync(RecipeDetailsResult.InvalidRecipeId());

        var controller = new RecipesController(Mock.Of<IRecipeSearchService>(), detailsService.Object);

        var result = await controller.Details(" ", CancellationToken.None);

        var badRequestResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        badRequestResult.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        badRequestResult.Value.Should().BeOfType<ProblemDetails>()
            .Which.Detail.Should().Be("The recipeId route parameter is required.");
    }

    [Fact]
    public async Task Details_WhenServiceReportsRecipeMissing_ReturnsNotFoundProblemDetails()
    {
        var detailsService = new Mock<IRecipeDetailsService>();
        detailsService
            .Setup(service => service.GetByRecipeIdAsync("404", It.IsAny<CancellationToken>()))
            .ReturnsAsync(RecipeDetailsResult.NotFound());

        var controller = new RecipesController(Mock.Of<IRecipeSearchService>(), detailsService.Object);

        var result = await controller.Details("404", CancellationToken.None);

        var notFoundResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        notFoundResult.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        notFoundResult.Value.Should().BeOfType<ProblemDetails>()
            .Which.Detail.Should().Be("Recipe details were not found on Cookpad.");
    }

    [Fact]
    public async Task Details_WhenServiceReportsExternalFailure_ReturnsBadGatewayProblemDetails()
    {
        var detailsService = new Mock<IRecipeDetailsService>();
        detailsService
            .Setup(service => service.GetByRecipeIdAsync("1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(RecipeDetailsResult.ExternalFailure());

        var controller = new RecipesController(Mock.Of<IRecipeSearchService>(), detailsService.Object);

        var result = await controller.Details("1", CancellationToken.None);

        var badGatewayResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        badGatewayResult.StatusCode.Should().Be(StatusCodes.Status502BadGateway);
        badGatewayResult.Value.Should().BeOfType<ProblemDetails>()
            .Which.Detail.Should().Be("Cookpad recipe details are currently unavailable.");
    }
}
