namespace CookingInspiration.Server.infrastructure.Cookpad;

public enum CookpadRecipeDetailsStatus
{
    Success,
    NotFound,
    Failure
}

public sealed record CookpadRecipeDetailsResult(CookpadRecipeDetailsStatus Status, CookpadRecipeDetails? Details)
{
    public static CookpadRecipeDetailsResult Success(CookpadRecipeDetails details)
    {
        return new CookpadRecipeDetailsResult(CookpadRecipeDetailsStatus.Success, details);
    }

    public static CookpadRecipeDetailsResult NotFound()
    {
        return new CookpadRecipeDetailsResult(CookpadRecipeDetailsStatus.NotFound, null);
    }

    public static CookpadRecipeDetailsResult Failure()
    {
        return new CookpadRecipeDetailsResult(CookpadRecipeDetailsStatus.Failure, null);
    }
}
