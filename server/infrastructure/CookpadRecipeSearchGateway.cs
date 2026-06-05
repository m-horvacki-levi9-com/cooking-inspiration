using System.Text.RegularExpressions;
using System.Text.Json;
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
        if (recipes.Count == 0)
        {
            return CookpadRecipeSearchResult.Failure();
        }

        var enrichedRecipes = await EnrichRecipesAsync(recipes, cancellationToken);
        return CookpadRecipeSearchResult.Success(enrichedRecipes);
    }

    private async Task<IReadOnlyList<CookpadRecipeCandidate>> EnrichRecipesAsync(IReadOnlyList<CookpadRecipeCandidate> recipes, CancellationToken cancellationToken)
    {
        var enrichmentTasks = recipes
            .Select(recipe => EnrichRecipeAsync(recipe, cancellationToken))
            .ToArray();

        return await Task.WhenAll(enrichmentTasks);
    }

    private async Task<CookpadRecipeCandidate> EnrichRecipeAsync(CookpadRecipeCandidate recipe, CancellationToken cancellationToken)
    {
        if (!NeedsEnrichment(recipe))
        {
            return recipe;
        }

        var details = await GetRecipeDetailsAsync(recipe.CookpadUrl, cancellationToken);
        if (details is null)
        {
            return recipe;
        }

        return recipe with
        {
            Title = IsFallbackTitle(recipe.Title) ? FirstNonEmpty(details.Title, recipe.Title)! : recipe.Title,
            ImageUrl = FirstNonEmpty(recipe.ImageUrl, details.ImageUrl),
            Description = FirstNonEmpty(recipe.Description, details.Description),
            Ingredients = recipe.Ingredients.Count > 0 ? recipe.Ingredients : details.Ingredients
        };
    }

    private static bool IsFallbackTitle(string title)
    {
        return title.StartsWith("Recipe ", StringComparison.OrdinalIgnoreCase)
            || title.Equals("Recipe", StringComparison.OrdinalIgnoreCase);
    }

    private static bool NeedsEnrichment(CookpadRecipeCandidate recipe)
    {
        return string.IsNullOrWhiteSpace(recipe.ImageUrl)
            || string.IsNullOrWhiteSpace(recipe.Description)
            || recipe.Ingredients.Count == 0;
    }

    private async Task<RecipeDetails?> GetRecipeDetailsAsync(string recipeUrl, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await httpClient.GetAsync(recipeUrl, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var html = await response.Content.ReadAsStringAsync(cancellationToken);
            if (IsChallengePage(html))
            {
                return null;
            }

            return ParseRecipeDetails(html);
        }
        catch (HttpRequestException)
        {
            return null;
        }
    }

    private static RecipeDetails? ParseRecipeDetails(string html)
    {
        var document = new HtmlDocument();
        document.LoadHtml(html);

        var detailsFromJsonLd = TryParseRecipeDetailsFromJsonLd(document);
        if (detailsFromJsonLd is not null)
        {
            return detailsFromJsonLd;
        }

        var title = CleanText(document.DocumentNode.SelectSingleNode("//meta[@property='og:title']")?.GetAttributeValue("content", null))
            ?? CleanText(document.DocumentNode.SelectSingleNode("//title")?.InnerText);
        var description = CleanText(document.DocumentNode.SelectSingleNode("//meta[@name='description']")?.GetAttributeValue("content", null));
        var imageUrl = FirstNonEmpty(
            document.DocumentNode.SelectSingleNode("//meta[@property='og:image']")?.GetAttributeValue("content", null),
            document.DocumentNode.SelectSingleNode("//img")?.GetAttributeValue("src", null));

        var ingredients = document.DocumentNode
            .SelectNodes("//li")
            ?.Select(ingredientNode => CleanText(ingredientNode.InnerText))
            .OfType<string>()
            .Distinct()
            .ToArray()
            ?? [];

        return new RecipeDetails(title, imageUrl, description, ingredients);
    }

    private static RecipeDetails? TryParseRecipeDetailsFromJsonLd(HtmlDocument document)
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

    private static bool TryParseRecipeDetailsFromJson(string json, out RecipeDetails? details)
    {
        details = null;

        try
        {
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;

            if (TryGetRecipeNode(root, out var recipeNode))
            {
                var title = GetStringProperty(recipeNode, "name");
                var imageUrl = GetImageFromJsonLd(recipeNode);
                var description = GetStringProperty(recipeNode, "description");
                var ingredients = GetStringArrayProperty(recipeNode, "recipeIngredient");

                details = new RecipeDetails(title, imageUrl, description, ingredients);
                return true;
            }
        }
        catch (JsonException)
        {
            return false;
        }

        return false;
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
        if (!IsSupportedRecipeHref(href))
        {
            return null;
        }

        var recipeContext = GetRecipeContextNode(node);
        var title = GetTitle(node, recipeContext);
        var imageUrl = GetImageUrl(node, recipeContext);
        var description = GetDescription(node, recipeContext);
        var ingredients = GetIngredients(node, recipeContext);

        if (string.IsNullOrWhiteSpace(title)
            && string.IsNullOrWhiteSpace(imageUrl)
            && string.IsNullOrWhiteSpace(description)
            && ingredients.Count == 0
            && !IsCanonicalRecipeHref(href))
        {
            return null;
        }

        title ??= BuildFallbackTitleFromHref(href);

        return new CookpadRecipeCandidate(
            title,
            BuildCookpadUrl(NormalizeHref(href)),
            imageUrl,
            description,
            ingredients);
    }

    private static bool IsSupportedRecipeHref(string href)
    {
        return href.Contains("/recipes/", StringComparison.OrdinalIgnoreCase)
            && !href.Contains("/recipes/new", StringComparison.OrdinalIgnoreCase)
            && !href.Contains("/bookmark_folders", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsCanonicalRecipeHref(string href)
    {
        return CanonicalRecipeHrefRegex().IsMatch(href);
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

    private static string BuildFallbackTitleFromHref(string href)
    {
        var match = RecipeIdRegex().Match(href);
        return match.Success ? $"Recipe {match.Groups[1].Value}" : "Recipe";
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

    private static IReadOnlyList<string> GetIngredients(HtmlNode linkNode, HtmlNode recipeContextNode)
    {
        var listIngredients = recipeContextNode.SelectNodes(".//ul/li")
            ?.Select(ingredientNode => CleanText(ingredientNode.InnerText))
            .OfType<string>()
            .ToArray()
            ?? [];

        if (listIngredients.Length > 0)
        {
            return listIngredients;
        }

        listIngredients = linkNode.SelectNodes(".//ul/li")
            ?.Select(ingredientNode => CleanText(ingredientNode.InnerText))
            .OfType<string>()
            .ToArray()
            ?? [];

        if (listIngredients.Length > 0)
        {
            return listIngredients;
        }

        var redesignedIngredients = recipeContextNode.SelectSingleNode(".//*[@data-ingredients-redesign-target='ingredients']")
            ?? linkNode.SelectSingleNode(".//*[@data-ingredients-redesign-target='ingredients']");

        return redesignedIngredients
            ?.DescendantsAndSelf()
            .Where(ingredientNode => ingredientNode.NodeType == HtmlNodeType.Text)
            .Select(ingredientNode => CleanText(ingredientNode.InnerText))
            .OfType<string>()
            .SelectMany(SplitIngredientSegments)
            .ToArray()
            ?? [];
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

    private static IEnumerable<string> SplitIngredientSegments(string value)
    {
        return IngredientSeparatorRegex()
            .Split(value)
            .Select(CleanText)
            .OfType<string>();
    }

    [GeneratedRegex(@"\s*[•·●▪]\s*")]
    private static partial Regex IngredientSeparatorRegex();

    [GeneratedRegex(@"/me/", RegexOptions.IgnoreCase)]
    private static partial Regex MeSegmentRegex();

    [GeneratedRegex(@"/bookmark_folders(/.*)?$", RegexOptions.IgnoreCase)]
    private static partial Regex BookmarkFoldersSegmentRegex();

    [GeneratedRegex(@"/recipes/(\d+)", RegexOptions.IgnoreCase)]
    private static partial Regex RecipeIdRegex();

    [GeneratedRegex(@"^/?([a-z]{2,3}/)?recipes/\d+", RegexOptions.IgnoreCase)]
    private static partial Regex CanonicalRecipeHrefRegex();

    private sealed record RecipeDetails(string? Title, string? ImageUrl, string? Description, IReadOnlyList<string> Ingredients);
}
