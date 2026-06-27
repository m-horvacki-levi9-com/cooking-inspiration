import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "../App";
import {
  getRecipeDetails,
  type RecipeDetails,
} from "../services/recipeDetailsService";
import {
  searchRecipes,
  type RecipeSearchListItem,
} from "../services/recipeSearchService";

vi.mock("../services/recipeSearchService", () => ({
  searchRecipes: vi.fn(),
}));

vi.mock("../services/recipeDetailsService", () => ({
  getRecipeDetails: vi.fn(),
}));

const mockedSearchRecipes = vi.mocked(searchRecipes);
const mockedGetRecipeDetails = vi.mocked(getRecipeDetails);

describe("App", () => {
  const compactRecipe: RecipeSearchListItem = {
    recipeId: "11111",
    title: "Creamy Pesto Pasta",
    cookpadUrl: "https://cookpad.com/recipe-1",
    imageUrl: "https://images.example.com/pasta.jpg",
    description: "A quick pasta dinner with pesto and cream.",
  };

  const recipeDetails: RecipeDetails = {
    recipeId: "11111",
    title: "Creamy Pesto Pasta",
    cookpadUrl: "https://cookpad.com/eng/recipes/11111",
    imageUrl: "https://images.example.com/pasta.jpg",
    description: "A quick pasta dinner with pesto and cream.",
    ingredients: ["Pasta", "Pesto", "Cream"],
    methodSteps: ["Boil pasta.", "Stir in pesto.", "Finish with cream."],
  };

  beforeEach(() => {
    mockedSearchRecipes.mockReset();
    mockedGetRecipeDetails.mockReset();
  });

  it("GivenSearchReturnsCompactRecipes_WhenSearching_ThenRendersListWithoutIngredientsOrMethodSteps", async () => {
    // Arrange
    const user = userEvent.setup();

    mockedSearchRecipes.mockResolvedValueOnce([
      compactRecipe,
      {
        recipeId: "22222",
        title: "Roasted Tomato Soup",
        cookpadUrl: "https://cookpad.com/recipe-2",
        imageUrl: null,
        description: null,
      },
    ]);

    // Act
    render(<App />);

    await user.type(
      screen.getByRole("textbox", {
        name: "What would you like to eat for the weekend?",
      }),
      "pasta",
    );
    await user.click(screen.getByRole("button", { name: "Search" }));

    // Assert
    expect(
      await screen.findByRole("heading", {
        level: 3,
        name: "Creamy Pesto Pasta",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Recipe ideas" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.queryByText("Ingredients")).not.toBeInTheDocument();
    expect(screen.queryByText("Method")).not.toBeInTheDocument();
    expect(mockedGetRecipeDetails).not.toHaveBeenCalled();
  });

  it("GivenCompactRecipeResult_WhenOpeningDetails_ThenLazyLoadsAndRendersIngredientsAndMethodSteps", async () => {
    // Arrange
    const user = userEvent.setup();

    mockedSearchRecipes.mockResolvedValueOnce([compactRecipe]);
    mockedGetRecipeDetails.mockResolvedValueOnce(recipeDetails);

    // Act
    render(<App />);

    await user.type(
      screen.getByRole("textbox", {
        name: "What would you like to eat for the weekend?",
      }),
      "pasta",
    );
    await user.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByRole("heading", {
      level: 3,
      name: "Creamy Pesto Pasta",
    });

    expect(mockedGetRecipeDetails).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "View details" }));

    // Assert
    expect(mockedGetRecipeDetails).toHaveBeenCalledWith("11111");

    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByText("Pasta")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("list", { name: "Method steps" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Boil pasta.")).toBeInTheDocument();
    expect(within(dialog).getByText("Stir in pesto.")).toBeInTheDocument();
    expect(within(dialog).getByText("Finish with cream.")).toBeInTheDocument();
  });

  it("GivenDelayedRecipeDetailsResponse_WhenOpeningDetails_ThenShowsLoadingStateBeforeDialog", async () => {
    // Arrange
    const user = userEvent.setup();
    let resolveDetails: ((value: RecipeDetails) => void) | undefined;

    mockedSearchRecipes.mockResolvedValueOnce([compactRecipe]);
    mockedGetRecipeDetails.mockReturnValueOnce(
      new Promise<RecipeDetails>((resolve) => {
        resolveDetails = resolve;
      }),
    );

    // Act
    render(<App />);

    await user.type(
      screen.getByRole("textbox", {
        name: "What would you like to eat for the weekend?",
      }),
      "pasta",
    );
    await user.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByRole("heading", {
      level: 3,
      name: "Creamy Pesto Pasta",
    });

    await user.click(screen.getByRole("button", { name: "View details" }));

    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading recipe details…",
    );

    resolveDetails?.(recipeDetails);

    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Boil pasta.")).toBeInTheDocument();
  });

  it("GivenRecipeDetailsWithoutMethodSteps_WhenOpeningDetails_ThenShowsMethodFallbackMessage", async () => {
    // Arrange
    const user = userEvent.setup();

    mockedSearchRecipes.mockResolvedValueOnce([compactRecipe]);
    mockedGetRecipeDetails.mockResolvedValueOnce({
      ...recipeDetails,
      methodSteps: [],
    });

    // Act
    render(<App />);

    await user.type(
      screen.getByRole("textbox", {
        name: "What would you like to eat for the weekend?",
      }),
      "pasta",
    );
    await user.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByRole("heading", {
      level: 3,
      name: "Creamy Pesto Pasta",
    });

    await user.click(screen.getByRole("button", { name: "View details" }));

    // Assert
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("Method steps are unavailable for this recipe."),
    ).toBeInTheDocument();
  });

  it("GivenRecipeDetailsDialog_WhenRenderingActions_ThenKeepsBringAffordanceWithoutViewRecipeLinkInModal", async () => {
    // Arrange
    const user = userEvent.setup();

    mockedSearchRecipes.mockResolvedValueOnce([compactRecipe]);
    mockedGetRecipeDetails.mockResolvedValueOnce(recipeDetails);

    // Act
    render(<App />);

    await user.type(
      screen.getByRole("textbox", {
        name: "What would you like to eat for the weekend?",
      }),
      "pasta",
    );
    await user.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByRole("heading", {
      level: 3,
      name: "Creamy Pesto Pasta",
    });

    expect(
      screen.getAllByRole("link", { name: "Import to Bring!" }),
    ).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "View details" }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).queryByRole("link", { name: "View recipe" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));

    // Assert
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
