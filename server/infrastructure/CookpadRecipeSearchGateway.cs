using System.Text.RegularExpressions;
using CookingInspiration.Server.services;
using HtmlAgilityPack;

namespace CookingInspiration.Server.infrastructure;

public sealed partial class CookpadRecipeSearchGateway(HttpClient httpClient) : ICookpadRecipeSearchGateway
{
    private static readonly string[] NoResultsMarkers =
    [
        "no recipes found",
        "couldn't find any recipes",
        "could not find any recipes",
        "sorry, we couldn't find any recipes",
        "sorry, we could not find any recipes"
    ];

    public async Task<CookpadRecipeSearchResult> SearchAsync(string keyword, CancellationToken cancellationToken)
    {
        using var response = await httpClient.GetAsync($"/eng/search/{Uri.EscapeDataString(keyword)}", cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return CookpadRecipeSearchResult.Failure();
        }

        var html = await response.Content.ReadAsStringAsync(cancellationToken);
        if (IsChallengePage(html))
        {
            return CookpadRecipeSearchResult.Failure();
        }

        if (ContainsNoResultsMarker(html))
        {
            return CookpadRecipeSearchResult.Success([]);
        }

        var recipes = ParseRecipes(html);
        return recipes.Count > 0
            ? CookpadRecipeSearchResult.Success(recipes)
            : CookpadRecipeSearchResult.Failure();
    }

    private static bool ContainsNoResultsMarker(string html)
    {
        return NoResultsMarkers.Any(marker => html.Contains(marker, StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsChallengePage(string html)
    {
        return html.Contains("<title>Client Challenge</title>", StringComparison.OrdinalIgnoreCase)
            || html.Contains("A required part of this site couldn’t load", StringComparison.OrdinalIgnoreCase)
            || html.Contains("JavaScript is disabled in your browser.", StringComparison.OrdinalIgnoreCase);
    }

    private static IReadOnlyList<CookpadRecipeCandidate> ParseRecipes(string html)
    {
        var document = new HtmlDocument();
        document.LoadHtml(html);

        return document.DocumentNode
            .SelectNodes("//a[@href]")
            ?.Select(MapRecipe)
            .OfType<CookpadRecipeCandidate>()
            .DistinctBy(recipe => recipe.CookpadUrl)
            .ToArray()
            ?? [];
    }

    private static CookpadRecipeCandidate? MapRecipe(HtmlNode node)
    {
        var href = node.GetAttributeValue("href", string.Empty).Trim();
        if (!href.Contains("/recipes/", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var title = GetTitle(node);
        if (string.IsNullOrWhiteSpace(title))
        {
            return null;
        }

        return new CookpadRecipeCandidate(
            title,
            BuildCookpadUrl(href),
            GetImageUrl(node),
            GetDescription(node));
    }

    private static string BuildCookpadUrl(string href)
    {
        return Uri.TryCreate(href, UriKind.Absolute, out var absoluteUri)
            ? absoluteUri.AbsoluteUri
            : new Uri(new Uri("https://cookpad.com"), href).AbsoluteUri;
    }

    private static string? GetDescription(HtmlNode node)
    {
        return CleanText(node.SelectSingleNode(".//p")?.InnerText);
    }

    private static string? GetImageUrl(HtmlNode node)
    {
        var imgNode = node.SelectSingleNode(".//img");
        return FirstNonEmpty(
            imgNode?.GetAttributeValue("src", null),
            imgNode?.GetAttributeValue("data-src", null),
            imgNode?.GetAttributeValue("data-lazy-src", null));
    }

    private static string? GetTitle(HtmlNode node)
    {
        return FirstNonEmpty(
            CleanText(node.SelectSingleNode(".//h1|.//h2|.//h3")?.InnerText),
            CleanText(node.SelectSingleNode(".//img")?.GetAttributeValue("alt", null)),
            CleanText(node.GetAttributeValue("title", null)));
    }

    private static string? FirstNonEmpty(params string?[] values)
    {
        return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
    }

    private static string? CleanText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return WhitespaceRegex().Replace(HtmlEntity.DeEntitize(value).Trim(), " ");
    }

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespaceRegex();
}
