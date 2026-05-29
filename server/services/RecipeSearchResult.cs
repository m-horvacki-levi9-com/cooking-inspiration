namespace CookingInspiration.Server.services;

public enum RecipeSearchStatus
{
    Success,
    InvalidKeyword,
    ExternalFailure
}

public sealed record RecipeSearchResult(RecipeSearchStatus Status, RecipeSearchResponse? Response)
{
    public static RecipeSearchResult Success(RecipeSearchResponse response)
    {
        return new RecipeSearchResult(RecipeSearchStatus.Success, response);
    }

    public static RecipeSearchResult InvalidKeyword()
    {
        return new RecipeSearchResult(RecipeSearchStatus.InvalidKeyword, null);
    }

    public static RecipeSearchResult ExternalFailure()
    {
        return new RecipeSearchResult(RecipeSearchStatus.ExternalFailure, null);
    }
}
