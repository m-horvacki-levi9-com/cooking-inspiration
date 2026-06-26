using CookingInspiration.Server.domain;

namespace CookingInspiration.Server.services;

public sealed record RecipeSearchResponse(IReadOnlyList<RecipeSummary> Recipes);
