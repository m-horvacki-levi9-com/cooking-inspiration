namespace CookingInspiration.Server.infrastructure;

public interface ICookpadRecipeSearchGateway
{
    Task<CookpadRecipeSearchResult> SearchAsync(string keyword, CancellationToken cancellationToken);
}
