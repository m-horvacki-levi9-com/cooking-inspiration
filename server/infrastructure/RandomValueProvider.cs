namespace CookingInspiration.Server.infrastructure;

public sealed class RandomValueProvider : IRandomValueProvider
{
    public int Next()
    {
        return Random.Shared.Next();
    }
}
