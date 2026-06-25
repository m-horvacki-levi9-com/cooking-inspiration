using System.Text.Json;
using System.Text.RegularExpressions;
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

        var recipes = ParseSearchRecipes(html);
        return recipes.Count == 0
            ? CookpadRecipeSearchResult.Failure()
            : CookpadRecipeSearchResult.Success(recipes);
    }

    public async Task<CookpadRecipeDetailsResult> GetByRecipeIdAsync(string recipeId, CancellationToken cancellationToken)
    {
        using var response = await httpClient.GetAsync($"/eng/recipes/{Uri.EscapeDataString(recipeId)}", cancellationToken);
        if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return CookpadRecipeDetailsResult.NotFound();
        }

        if (!response.IsSuccessStatusCode)
        {
            return CookpadRecipeDetailsResult.Failure();
        }

        var html = await response.Content.ReadAsStringAsync(cancellationToken);
        if (IsChallengePage(html))
        {
            return CookpadRecipeDetailsResult.Failure();
        }

        return ParseRecipeDetails(html, recipeId) is { } details
            ? CookpadRecipeDetailsResult.Success(details)
            : CookpadRecipeDetailsResult.Failure();
    }

    private static IReadOnlyList<CookpadRecipeCandidate> ParseSearchRecipes(string html)
    {
        var document = new HtmlDocument();
        document.LoadHtml(html);

        return document.DocumentNode
            .SelectNodes("//a[@href]")
            ?.Select(MapSearchRecipe)
            .OfType<CookpadRecipeCandidate>()
            .DistinctBy(recipe => recipe.CookpadUrl)
            .ToArray()
            ?? [];
    }

    private static CookpadRecipeCandidate? MapSearchRecipe(HtmlNode node)
    {
        var href = node.GetAttributeValue("href", string.Empty).Trim();
        if (!IsSupportedRecipeHref(href))
        {
            return null;
        }

        var normalizedHref = NormalizeHref(href);
        if (!TryExtractRecipeId(normalizedHref, out var recipeId))
        {
            return null;
        }

        var recipeContext = GetRecipeContextNode(node);
        var title = GetTitle(node, recipeContext) ?? $"Recipe {recipeId}";
        var imageUrl = GetImageUrl(node, recipeContext);
        var description = GetDescription(node, recipeContext);

        return new CookpadRecipeCandidate(
            recipeId,
            title,
            BuildCookpadUrl(normalizedHref),
            imageUrl,
            description);
    }

    private static CookpadRecipeDetails? ParseRecipeDetails(string html, string recipeId)
    {
        var document = new HtmlDocument();
        document.LoadHtml(html);

        var jsonLd = TryParseRecipeDetailsFromJsonLd(document);
        var fallback = ParseDetailsFallback(document);
        var steps = jsonLd?.MethodSteps.Count > 0 ? jsonLd.MethodSteps : fallback.MethodSteps;
        var title = FirstNonEmpty(jsonLd?.Title, fallback.Title);
        if (string.IsNullOrWhiteSpace(title))
        {
            return null;
        }

        return new CookpadRecipeDetails(
            recipeId,
            title!,
            FirstNonEmpty(jsonLd?.CookpadUrl, fallback.CookpadUrl, BuildCookpadUrl($"/eng/recipes/{recipeId}"))!,
            FirstNonEmpty(jsonLd?.ImageUrl, fallback.ImageUrl),
            FirstNonEmpty(jsonLd?.Description, fallback.Description),
            jsonLd?.Ingredients.Count > 0 ? jsonLd.Ingredients : fallback.Ingredients,
            steps);
    }

    private static RecipeDetailsData ParseDetailsFallback(HtmlDocument document)
    {
        var title = FirstNonEmpty(
            CleanText(document.DocumentNode.SelectSingleNode("//meta[@property='og:title']")?.GetAttributeValue("content", null)),
            CleanText(document.DocumentNode.SelectSingleNode("//title")?.InnerText));
        var description = CleanText(document.DocumentNode.SelectSingleNode("//meta[@name='description']")?.GetAttributeValue("content", null));
        var imageUrl = FirstNonEmpty(
            document.DocumentNode.SelectSingleNode("//meta[@property='og:image']")?.GetAttributeValue("content", null),
            document.DocumentNode.SelectSingleNode("//img")?.GetAttributeValue("src", null));
        var cookpadUrl = CleanText(document.DocumentNode.SelectSingleNode("//meta[@property='og:url']")?.GetAttributeValue("content", null));

        var ingredients = document.DocumentNode
            .SelectNodes("//li[@itemprop='recipeIngredient']|//*[@data-ingredients-redesign-target='ingredients']//li|//*[@data-ingredients-redesign-target='ingredients']//p|//*[@data-ingredients-redesign-target='ingredients']//div")
            ?.Select(node => CleanText(node.InnerText))
            .OfType<string>()
            .Distinct()
            .ToArray()
            ?? [];

        var methodSteps = ParseMethodStepsFromHtml(document);
        return new RecipeDetailsData(title, cookpadUrl, imageUrl, description, ingredients, methodSteps);
    }

    private static IReadOnlyList<string> ParseMethodStepsFromHtml(HtmlDocument document)
    {
        var methodSection = document.DocumentNode.SelectSingleNode(
            "//h1[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'method') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'instruction') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'step')]|" +
            "//h2[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'method') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'instruction') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'step')]|" +
            "//h3[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'method') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'instruction') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'step')]");

        var scopedSteps = methodSection?
            .SelectNodes("following-sibling::ol[1]/li|following-sibling::ul[1]/li|following-sibling::*[1]//li")
            ?.Select(step => CleanText(step.InnerText))
            .OfType<string>()
            .ToArray();

        if (scopedSteps is { Length: > 0 })
        {
            return scopedSteps;
        }

        return document.DocumentNode
            .SelectNodes("//ol/li[@itemprop='recipeInstructions']|//li[@itemprop='recipeInstructions']")
            ?.Select(step => CleanText(step.InnerText))
            .OfType<string>()
            .ToArray()
            ?? [];
    }

    private static RecipeDetailsData? TryParseRecipeDetailsFromJsonLd(HtmlDocument document)
    {
        var jsonLdNodes = document.DocumentNode.SelectNodes("//script[@type='application/ld+json']");
        if (jsonLdNodes is null)
        {
            return null;
        }

        foreach (var jsonLdNode in jsonLdNodes)
        {
            if (TryParseRecipeDetailsFromJson(jsonLdNode.InnerText, out var details))
            {
                return details;
            }
        }

        return null;
    }

    private static bool TryParseRecipeDetailsFromJson(string json, out RecipeDetailsData? details)
    {
        details = null;

        try
        {
            using var document = JsonDocument.Parse(json);
            if (!TryGetRecipeNode(document.RootElement, out var recipeNode))
            {
                return false;
            }

            details = new RecipeDetailsData(
                GetStringProperty(recipeNode, "name"),
                GetCookpadUrl(recipeNode),
                GetImageFromJsonLd(recipeNode),
                GetStringProperty(recipeNode, "description"),
                GetStringArrayProperty(recipeNode, "recipeIngredient"),
                GetMethodStepsFromJsonLd(recipeNode));
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static IReadOnlyList<string> GetMethodStepsFromJsonLd(JsonElement recipeNode)
    {
        if (!recipeNode.TryGetProperty("recipeInstructions", out var instructionsNode))
        {
            return [];
        }

        return instructionsNode.ValueKind switch
        {
            JsonValueKind.String => ToSingleStep(instructionsNode.GetString()),
            JsonValueKind.Array => instructionsNode
                .EnumerateArray()
                .SelectMany(GetInstructionSteps)
                .Distinct()
                .ToArray(),
            JsonValueKind.Object => GetInstructionSteps(instructionsNode).Distinct().ToArray(),
            _ => []
        };
    }

    private static IEnumerable<string> GetInstructionSteps(JsonElement instructionNode)
    {
        if (instructionNode.ValueKind == JsonValueKind.String)
        {
            return ToSingleStep(instructionNode.GetString());
        }

        if (instructionNode.ValueKind != JsonValueKind.Object)
        {
            return [];
        }

        var text = GetStringProperty(instructionNode, "text");
        if (!string.IsNullOrWhiteSpace(text))
        {
            return [text];
        }

        if (instructionNode.TryGetProperty("itemListElement", out var itemsNode) && itemsNode.ValueKind == JsonValueKind.Array)
        {
            return itemsNode.EnumerateArray().SelectMany(GetInstructionSteps);
        }

        return [];
    }

    private static IReadOnlyList<string> ToSingleStep(string? step)
    {
        return CleanText(step) is { } value ? [value] : [];
    }

    private static bool TryGetRecipeNode(JsonElement element, out JsonElement recipeNode)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            if (IsRecipeType(element))
            {
                recipeNode = element;
                return true;
            }

            if (element.TryGetProperty("@graph", out var graphElement) && TryGetRecipeNode(graphElement, out recipeNode))
            {
                return true;
            }
        }

        if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in element.EnumerateArray())
            {
                if (TryGetRecipeNode(item, out recipeNode))
                {
                    return true;
                }
            }
        }

        recipeNode = default;
        return false;
    }

    private static bool IsRecipeType(JsonElement element)
    {
        if (!element.TryGetProperty("@type", out var typeProperty))
        {
            return false;
        }

        return typeProperty.ValueKind switch
        {
            JsonValueKind.String => typeProperty.GetString()?.Contains("Recipe", StringComparison.OrdinalIgnoreCase) == true,
            JsonValueKind.Array => typeProperty
                .EnumerateArray()
                .Any(typeElement => typeElement.ValueKind == JsonValueKind.String
                    && typeElement.GetString()?.Contains("Recipe", StringComparison.OrdinalIgnoreCase) == true),
            _ => false
        };
    }

    private static string? GetCookpadUrl(JsonElement recipeNode)
    {
        var url = GetStringProperty(recipeNode, "url");
        if (!string.IsNullOrWhiteSpace(url))
        {
            return url;
        }

        if (!recipeNode.TryGetProperty("mainEntityOfPage", out var mainEntityNode))
        {
            return null;
        }

        if (mainEntityNode.ValueKind == JsonValueKind.String)
        {
            return CleanText(mainEntityNode.GetString());
        }

        return mainEntityNode.ValueKind == JsonValueKind.Object
            ? GetStringProperty(mainEntityNode, "@id")
            : null;
    }

    private static string? GetImageFromJsonLd(JsonElement recipeNode)
    {
        if (!recipeNode.TryGetProperty("image", out var imageProperty))
        {
            return null;
        }

        return imageProperty.ValueKind switch
        {
            JsonValueKind.String => imageProperty.GetString(),
            JsonValueKind.Array => imageProperty
                .EnumerateArray()
                .Select(GetImageValue)
                .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value)),
            JsonValueKind.Object => GetImageValue(imageProperty),
            _ => null
        };
    }

    private static string? GetImageValue(JsonElement imageElement)
    {
        return imageElement.ValueKind switch
        {
            JsonValueKind.String => imageElement.GetString(),
            JsonValueKind.Object => GetStringProperty(imageElement, "url"),
            _ => null
        };
    }

    private static string? GetStringProperty(JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out var propertyValue) && propertyValue.ValueKind == JsonValueKind.String
            ? CleanText(propertyValue.GetString())
            : null;
    }

    private static IReadOnlyList<string> GetStringArrayProperty(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var propertyValue) || propertyValue.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return propertyValue
            .EnumerateArray()
            .Where(item => item.ValueKind == JsonValueKind.String)
            .Select(item => CleanText(item.GetString()))
            .OfType<string>()
            .ToArray();
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

    private static bool IsSupportedRecipeHref(string href)
    {
        return href.Contains("/recipes/", StringComparison.OrdinalIgnoreCase)
            && !href.Contains("/recipes/new", StringComparison.OrdinalIgnoreCase)
            && !href.Contains("/bookmark_folders", StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryExtractRecipeId(string href, out string recipeId)
    {
        var match = RecipeIdRegex().Match(href);
        recipeId = match.Success ? match.Groups[1].Value : string.Empty;
        return match.Success;
    }

    private static HtmlNode GetRecipeContextNode(HtmlNode node)
    {
        var articleNode = node.Ancestors("article").FirstOrDefault();
        if (articleNode is null)
        {
            return node;
        }

        var recipeLinkCount = articleNode
            .SelectNodes(".//a[@href]")
            ?.Select(anchor => anchor.GetAttributeValue("href", string.Empty))
            .Count(IsSupportedRecipeHref)
            ?? 0;

        return recipeLinkCount <= 2 ? articleNode : node;
    }

    private static string NormalizeHref(string href)
    {
        var normalized = MeSegmentRegex().Replace(href, "/");
        return BookmarkFoldersSegmentRegex().Replace(normalized, string.Empty);
    }

    private static string BuildCookpadUrl(string href)
    {
        return Uri.TryCreate(href, UriKind.Absolute, out var absoluteUri)
            ? absoluteUri.AbsoluteUri
            : new Uri(new Uri("https://cookpad.com"), href).AbsoluteUri;
    }

    private static string? GetDescription(HtmlNode linkNode, HtmlNode recipeContextNode)
    {
        return FirstNonEmpty(
            CleanText(recipeContextNode.SelectSingleNode(".//p")?.InnerText),
            CleanText(linkNode.SelectSingleNode(".//p")?.InnerText));
    }

    private static string? GetImageUrl(HtmlNode linkNode, HtmlNode recipeContextNode)
    {
        var imgNode = recipeContextNode.SelectSingleNode(".//img")
            ?? linkNode.SelectSingleNode(".//img");

        return FirstNonEmpty(
            imgNode?.GetAttributeValue("src", null),
            imgNode?.GetAttributeValue("data-src", null),
            imgNode?.GetAttributeValue("data-lazy-src", null),
            GetUrlFromSrcSet(imgNode?.GetAttributeValue("srcset", null)),
            GetUrlFromSrcSet(imgNode?.GetAttributeValue("data-srcset", null)));
    }

    private static string? GetTitle(HtmlNode linkNode, HtmlNode recipeContextNode)
    {
        return FirstNonEmpty(
            CleanText(recipeContextNode.SelectSingleNode(".//h1|.//h2|.//h3")?.InnerText),
            CleanText(linkNode.SelectSingleNode(".//h1|.//h2|.//h3")?.InnerText),
            CleanText(recipeContextNode.SelectSingleNode(".//img")?.GetAttributeValue("alt", null)),
            CleanText(linkNode.SelectSingleNode(".//img")?.GetAttributeValue("alt", null)),
            CleanText(linkNode.GetAttributeValue("title", null)));
    }

    private static string? GetUrlFromSrcSet(string? srcSet)
    {
        return srcSet?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(candidate => candidate.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault())
            .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
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

    [GeneratedRegex(@"/me/", RegexOptions.IgnoreCase)]
    private static partial Regex MeSegmentRegex();

    [GeneratedRegex(@"/bookmark_folders(/.*)?$", RegexOptions.IgnoreCase)]
    private static partial Regex BookmarkFoldersSegmentRegex();

    [GeneratedRegex(@"/recipes/(\d+)", RegexOptions.IgnoreCase)]
    private static partial Regex RecipeIdRegex();

    private sealed record RecipeDetailsData(
        string? Title,
        string? CookpadUrl,
        string? ImageUrl,
        string? Description,
        IReadOnlyList<string> Ingredients,
        IReadOnlyList<string> MethodSteps);
}
