import { render, screen } from "@testing-library/react";

import RecipeCard from "../components/RecipeCard";
import type { RecipeDetails } from "../services/recipeDetailsService";

const baseRecipe: RecipeDetails = {
  recipeId: "11111",
  title: "Creamy Pesto Pasta",
  cookpadUrl: "https://cookpad.com/recipe-1",
  imageUrl: "https://images.example.com/pasta.jpg",
  description: "A quick pasta dinner with pesto and cream.",
  ingredients: ["Pasta", "Pesto", "Cream"],
  methodSteps: ["Boil pasta.", "Mix sauce."],
};

const renderBringWidget = vi.fn();

describe("RecipeCard", () => {
  beforeEach(() => {
    renderBringWidget.mockReset();
    window.bringwidgets = {
      import: {
        render: renderBringWidget,
      },
    };
  });

  it("GivenRecipeDetails_WhenRenderingCard_ThenShowsTitleDescriptionAndIngredients", () => {
    // Arrange

    // Act
    render(<RecipeCard recipe={baseRecipe} />);

    // Assert
    expect(
      screen.getByRole("heading", { level: 3, name: "Creamy Pesto Pasta" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("A quick pasta dinner with pesto and cream."),
    ).toBeInTheDocument();
    expect(screen.getByText("Pasta")).toBeInTheDocument();
    expect(screen.getByText("Pesto")).toBeInTheDocument();
    expect(screen.getByText("Cream")).toBeInTheDocument();
  });

  it("GivenRecipeWithCookpadUrl_WhenRenderingCard_ThenShowsViewRecipeLinkWithExpectedAttributes", () => {
    // Arrange

    // Act
    render(<RecipeCard recipe={baseRecipe} />);

    const link = screen.getByRole("link", { name: "View recipe" });

    // Assert
    expect(link).toHaveAttribute("href", "https://cookpad.com/recipe-1");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("GivenRecipeWithCookpadUrl_WhenRenderingCard_ThenShowsImportToBringLink", () => {
    // Arrange

    // Act
    render(<RecipeCard recipe={baseRecipe} />);

    const bringLink = screen.getByRole("link", { name: "Import to Bring!" });

    // Assert
    expect(bringLink).toBeInTheDocument();
    expect(bringLink).toHaveAttribute(
      "href",
      "https://www.getbring.com/en/home",
    );
    expect(bringLink).toHaveAttribute("target", "_blank");
    expect(bringLink).toHaveAttribute("rel", "noreferrer");
  });

  it("GivenBringWidgetIsAvailable_WhenRenderingCard_ThenRendersBringWidgetWithRecipeUrlAndEnglishConfig", () => {
    // Arrange

    // Act
    render(<RecipeCard recipe={baseRecipe} />);

    // Assert
    expect(renderBringWidget).toHaveBeenCalledTimes(1);
    expect(renderBringWidget.mock.calls[0]?.[0]).toBeInstanceOf(HTMLDivElement);
    expect(renderBringWidget).toHaveBeenCalledWith(expect.any(HTMLDivElement), {
      url: "https://cookpad.com/recipe-1",
      language: "en",
      theme: "light",
    });
  });

  it("GivenRecipeWithoutCookpadUrl_WhenRenderingCard_ThenDoesNotRenderImportToBringLink", () => {
    // Arrange
    const recipeWithoutUrl: RecipeDetails = { ...baseRecipe, cookpadUrl: "" };

    // Act
    render(<RecipeCard recipe={recipeWithoutUrl} />);

    // Assert
    expect(
      screen.queryByRole("link", { name: "Import to Bring!" }),
    ).not.toBeInTheDocument();
    expect(renderBringWidget).not.toHaveBeenCalled();
  });

  it("GivenBringWidgetScriptIsUnavailable_WhenRenderingCard_ThenKeepsFallbackBringLink", () => {
    // Arrange
    window.bringwidgets = undefined;

    // Act
    render(<RecipeCard recipe={baseRecipe} />);

    // Assert
    expect(
      screen.getByRole("link", { name: "Import to Bring!" }),
    ).toBeInTheDocument();
  });

  it("GivenBringWidgetLoadsAfterInitialRender_WhenScriptLoadEventFires_ThenRendersBringWidget", () => {
    // Arrange
    window.bringwidgets = undefined;
    const bringScript = document.createElement("script");
    bringScript.src = "https://platform.getbring.com/widgets/import.js";
    document.head.appendChild(bringScript);

    // Act
    render(<RecipeCard recipe={baseRecipe} />);

    expect(renderBringWidget).not.toHaveBeenCalled();
    expect(
      screen.getByRole("link", { name: "Import to Bring!" }),
    ).toBeInTheDocument();

    window.bringwidgets = {
      import: {
        render: renderBringWidget,
      },
    };
    bringScript.dispatchEvent(new Event("load"));

    // Assert
    expect(renderBringWidget).toHaveBeenCalledTimes(1);
    expect(renderBringWidget).toHaveBeenCalledWith(expect.any(HTMLDivElement), {
      url: "https://cookpad.com/recipe-1",
      language: "en",
      theme: "light",
    });

    bringScript.remove();
  });

  it("GivenRecipeWithoutImage_WhenRenderingCard_ThenShowsImagePlaceholderText", () => {
    // Arrange
    const recipeNoImage: RecipeDetails = { ...baseRecipe, imageUrl: null };

    // Act
    render(<RecipeCard recipe={recipeNoImage} />);

    // Assert
    expect(screen.getByText("Image coming soon")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("GivenRecipeWithoutDescription_WhenRenderingCard_ThenShowsDefaultDescriptionText", () => {
    // Arrange
    const recipeNoDescription: RecipeDetails = {
      ...baseRecipe,
      description: null,
    };

    // Act
    render(<RecipeCard recipe={recipeNoDescription} />);

    // Assert
    expect(screen.getByText("Description coming soon.")).toBeInTheDocument();
  });

  it("GivenRecipeWithoutIngredients_WhenRenderingCard_ThenShowsDefaultIngredientsText", () => {
    // Arrange
    const recipeNoIngredients: RecipeDetails = {
      ...baseRecipe,
      ingredients: [],
    };

    // Act
    render(<RecipeCard recipe={recipeNoIngredients} />);

    // Assert
    expect(screen.getByText("Ingredients coming soon.")).toBeInTheDocument();
  });
});
