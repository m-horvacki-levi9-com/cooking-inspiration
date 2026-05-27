const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const indexPath = path.join(__dirname, "..", "index.html");
const html = fs.readFileSync(indexPath, "utf8");

test("renders four featured recipe cards", () => {
  const cards = html.match(/class="recipe-card/g) ?? [];
  assert.equal(cards.length, 4);
});

test("includes Bring widget metadata for each recipe", () => {
  const bringSlots = html.match(/data-bring-import="https:\/\/[^"]+"/g) ?? [];
  assert.equal(bringSlots.length, 4);

  const bringTitles = html.match(/data-title="/g) ?? [];
  assert.equal(bringTitles.length, 4);

  const bringItems = html.match(/data-items="/g) ?? [];
  assert.equal(bringItems.length, 4);

  const bringFallbackLinks = html.match(/href="https:\/\/www\.getbring\.com\/en\/home"/g) ?? [];
  assert.equal(bringFallbackLinks.length, 4);
});

test("highlights top recipe sources in the page copy", () => {
  for (const source of [
    "Cookpad",
    "Food Network",
    "The Kitchn",
    "Serious Eats",
  ]) {
    assert.match(html, new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
