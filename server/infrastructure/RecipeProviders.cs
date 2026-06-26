namespace CookingInspiration.Server.infrastructure;

public static class RecipeProviders
{
    public const string Cookpad = "cookpad";
    public const string Stub = "stub";

    public const string Default = Cookpad;

    public static string Normalize(string? providerKey)
    {
        return string.IsNullOrWhiteSpace(providerKey)
            ? Default
            : providerKey.Trim().ToLowerInvariant();
    }
}
