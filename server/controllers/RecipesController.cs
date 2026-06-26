using CookingInspiration.Server.domain;
using CookingInspiration.Server.services;
using Microsoft.AspNetCore.Mvc;

namespace CookingInspiration.Server.controllers;

[ApiController]
[Route("api/recipes")]
public sealed class RecipesController(IRecipeSearchService recipeSearchService, IRecipeDetailsService recipeDetailsService) : ControllerBase
{
    [HttpGet("search")]
    public async Task<ActionResult<RecipeSearchResponse>> Search([FromQuery] string? keyword, [FromQuery] string? provider, CancellationToken cancellationToken)
    {
        var result = await recipeSearchService.SearchAsync(keyword, provider, cancellationToken);

        return result.Status switch
        {
            RecipeSearchStatus.Success => Ok(result.Response),
            RecipeSearchStatus.InvalidKeyword => Problem(
                detail: "The keyword query parameter is required.",
                statusCode: StatusCodes.Status400BadRequest),
            RecipeSearchStatus.ExternalFailure => Problem(
                detail: "Cookpad recipe search is currently unavailable.",
                statusCode: StatusCodes.Status502BadGateway),
            _ => throw new InvalidOperationException($"Unsupported recipe search status '{result.Status}'.")
        };
    }

    [HttpGet("{recipeId}")]
    public async Task<ActionResult<RecipeCard>> Details([FromRoute] string recipeId, [FromQuery] string? provider, CancellationToken cancellationToken)
    {
        var result = await recipeDetailsService.GetByRecipeIdAsync(recipeId, provider, cancellationToken);

        return result.Status switch
        {
            RecipeDetailsStatus.Success => Ok(result.Response),
            RecipeDetailsStatus.InvalidRecipeId => Problem(
                detail: "The recipeId route parameter is required.",
                statusCode: StatusCodes.Status400BadRequest),
            RecipeDetailsStatus.NotFound => Problem(
                detail: "Recipe details were not found on Cookpad.",
                statusCode: StatusCodes.Status404NotFound),
            RecipeDetailsStatus.ExternalFailure => Problem(
                detail: "Cookpad recipe details are currently unavailable.",
                statusCode: StatusCodes.Status502BadGateway),
            _ => throw new InvalidOperationException($"Unsupported recipe details status '{result.Status}'.")
        };
    }
}
