const cards = Array.from(document.querySelectorAll(".recipe-card"));
const selectedTitle = document.querySelector("#selected-title");
const selectedSource = document.querySelector("#selected-source");
const selectedSummary = document.querySelector("#selected-summary");
const selectedTime = document.querySelector("#selected-time");
const selectedServings = document.querySelector("#selected-servings");
const selectedIngredients = document.querySelector("#selected-ingredients");
const selectedLink = document.querySelector("#selected-link");

function getRecipeTitle(card) {
  return card.querySelector("[itemprop='name']").textContent.trim();
}

function getRecipeIngredients(card) {
  return Array.from(card.querySelectorAll("[itemprop='recipeIngredient']"))
    .map((ingredient) => ingredient.textContent.trim())
    .filter(Boolean);
}

function syncBringImportMetadata(card) {
  const bringImportContainer = card.querySelector("[data-bring-import]");
  if (!bringImportContainer) {
    return;
  }

  const title = getRecipeTitle(card);
  const ingredients = getRecipeIngredients(card);

  bringImportContainer.dataset.title = title;
  bringImportContainer.dataset.items = ingredients.join(", ");
}

function updateSelection(card) {
  cards.forEach((recipeCard) => {
    const isSelected = recipeCard === card;
    recipeCard.classList.toggle("is-selected", isSelected);
    recipeCard.dataset.selected = String(isSelected);

    const button = recipeCard.querySelector(".select-button");
    button.setAttribute("aria-pressed", String(isSelected));
    button.textContent = isSelected ? "Selected" : "Select recipe";
  });

  selectedTitle.textContent = getRecipeTitle(card);
  selectedSource.textContent = card.dataset.source;
  selectedSummary.textContent = card.dataset.summary;
  selectedTime.textContent = card.dataset.time;
  selectedServings.textContent = card.dataset.servings;
  selectedLink.href = card.dataset.link;

  selectedIngredients.innerHTML = "";

  card.querySelectorAll("[itemprop='recipeIngredient']").forEach((ingredient, index) => {
    if (index < 4) {
      const listItem = document.createElement("li");
      listItem.textContent = ingredient.textContent;
      selectedIngredients.appendChild(listItem);
    }
  });
}

cards.forEach((card) => {
  syncBringImportMetadata(card);

  card.querySelector(".select-button").addEventListener("click", () => {
    updateSelection(card);
  });
});

if (cards.length > 0) {
  updateSelection(cards[0]);
}
