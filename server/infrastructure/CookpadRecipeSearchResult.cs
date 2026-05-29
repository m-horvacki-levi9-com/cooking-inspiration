namespace CookingInspiration.Server.infrastructure;

public sealed record CookpadRecipeSearchResult(bool IsSuccess, IReadOnlyList<CookpadRecipeCandidate> Recipes)
{
    public static CookpadRecipeSearchResult Success(IReadOnlyList<CookpadRecipeCandidate> recipes)
    {
        return new CookpadRecipeSearchResult(true, recipes);
    }

    public static CookpadRecipeSearchResult Failure()
    {
        return new CookpadRecipeSearchResult(false, []);
    }
}
