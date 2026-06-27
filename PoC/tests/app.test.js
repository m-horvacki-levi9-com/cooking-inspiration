const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const indexPath = path.join(__dirname, "..", "index.html");
const html = fs.readFileSync(indexPath, "utf8");

test("GivenPocIndexHtml_WhenCountingRecipeCards_ThenRendersFourFeaturedRecipeCards", () => {
  // Arrange

  // Act
  const cards = html.match(/class="recipe-card/g) ?? [];

  // Assert
  assert.equal(cards.length, 4);
});

test("GivenPocIndexHtml_WhenValidatingBringMetadata_ThenIncludesBringWidgetMetadataForEachRecipe", () => {
  // Arrange

  // Act
  const bringSlots = html.match(/data-bring-import="https:\/\/[^"]+"/g) ?? [];
  assert.equal(bringSlots.length, 4);

  const bringTitles = html.match(/data-title="/g) ?? [];
  assert.equal(bringTitles.length, 4);

  const bringItems = html.match(/data-items="/g) ?? [];
  assert.equal(bringItems.length, 4);

  const bringFallbackLinks =
    html.match(/href="https:\/\/www\.getbring\.com\/en\/home"/g) ?? [];

  // Assert
  assert.equal(bringFallbackLinks.length, 4);
});

test("GivenPocIndexHtml_WhenReadingPageCopy_ThenHighlightsTopRecipeSources", () => {
  // Arrange

  // Act
  for (const source of [
    "Cookpad",
    "Food Network",
    "The Kitchn",
    "Serious Eats",
  ]) {
    // Assert
    assert.match(
      html,
      new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
