using CookingInspiration.Server.domain;

namespace CookingInspiration.Server.services;

public enum RecipeDetailsStatus
{
    Success,
    InvalidRecipeId,
    NotFound,
    ExternalFailure
}

public sealed record RecipeDetailsResult(RecipeDetailsStatus Status, RecipeCard? Response)
{
    public static RecipeDetailsResult Success(RecipeCard response)
    {
        return new RecipeDetailsResult(RecipeDetailsStatus.Success, response);
    }

    public static RecipeDetailsResult InvalidRecipeId()
    {
        return new RecipeDetailsResult(RecipeDetailsStatus.InvalidRecipeId, null);
    }

    public static RecipeDetailsResult NotFound()
    {
        return new RecipeDetailsResult(RecipeDetailsStatus.NotFound, null);
    }

    public static RecipeDetailsResult ExternalFailure()
    {
        return new RecipeDetailsResult(RecipeDetailsStatus.ExternalFailure, null);
    }
}
