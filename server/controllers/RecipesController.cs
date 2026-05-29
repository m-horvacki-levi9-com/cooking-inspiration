using CookingInspiration.Server.services;
using Microsoft.AspNetCore.Mvc;

namespace CookingInspiration.Server.controllers;

[ApiController]
[Route("api/recipes")]
public sealed class RecipesController(IRecipeSearchService recipeSearchService) : ControllerBase
{
    [HttpGet("search")]
    public async Task<ActionResult<RecipeSearchResponse>> Search([FromQuery] string? keyword, CancellationToken cancellationToken)
    {
        var result = await recipeSearchService.SearchAsync(keyword, cancellationToken);

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
}
