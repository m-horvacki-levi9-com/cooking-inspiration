import type { FormEvent } from "react";
import { useState } from "react";

import Box from "@mui/material/Box";
import Backdrop from "@mui/material/Backdrop";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import RecipeCardModal from "../components/RecipeCardModal";
import RecipeSummariesListItem from "../components/RecipeSummariesListItem";
import {
  getRecipeDetails,
  type RecipeDetails,
} from "../services/recipeCardService";
import {
  searchRecipes,
  type RecipeSearchListItem,
} from "../services/recipeSummariesService";
import {
  appOwnedBringButtonDisabledSx,
  appOwnedBringButtonSx,
} from "../styles/bringButtonStyles";
import "../styles/home-page.css";

type SearchStatus = "idle" | "loading" | "success" | "empty" | "error";
type DetailsStatus = "idle" | "loading" | "success" | "error";

const panelSx = {
  backgroundColor: "var(--app-surface)",
  border: "1px solid var(--app-border)",
  borderRadius: "1.75rem",
  boxShadow: "var(--app-shadow)",
  backdropFilter: "blur(16px)",
} as const;

const fadeSlideIn = {
  "@keyframes fadeSlideIn": {
    from: { opacity: 0, transform: "translateY(12px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
    opacity: 1,
  },
  animation: "fadeSlideIn 0.45s ease forwards",
} as const;

function HomePage() {
  const [keyword, setKeyword] = useState("");
  const [recipes, setRecipes] = useState<RecipeSearchListItem[]>([]);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [selectedRecipe, setSelectedRecipe] =
    useState<RecipeSearchListItem | null>(null);
  const [selectedRecipeDetails, setSelectedRecipeDetails] =
    useState<RecipeDetails | null>(null);
  const [detailsStatus, setDetailsStatus] = useState<DetailsStatus>("idle");
  const [isRecipeDetailOpen, setIsRecipeDetailOpen] = useState(false);

  const trimmedKeyword = keyword.trim();
  const isSearchDisabled =
    trimmedKeyword.length === 0 || searchStatus === "loading";
  const isDetailsLoading = detailsStatus === "loading";

  async function performSearch(nextKeyword: string) {
    const normalizedKeyword = nextKeyword.trim();

    if (normalizedKeyword.length === 0 || searchStatus === "loading") {
      return;
    }

    setKeyword(normalizedKeyword);
    setSelectedRecipe(null);
    setSelectedRecipeDetails(null);
    setDetailsStatus("idle");
    setIsRecipeDetailOpen(false);
    setSearchStatus("loading");
    setSubmittedKeyword(normalizedKeyword);
    setRecipes([]);

    try {
      const foundRecipes = await searchRecipes(normalizedKeyword);

      setRecipes(foundRecipes);
      setSearchStatus(foundRecipes.length > 0 ? "success" : "empty");
    } catch {
      setSearchStatus("error");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void performSearch(keyword);
  }

  function handleViewDetails(recipe: RecipeSearchListItem): void {
    setSelectedRecipe(recipe);
    setSelectedRecipeDetails(null);
    setDetailsStatus("loading");
    setIsRecipeDetailOpen(false);

    void (async () => {
      try {
        const details = await getRecipeDetails(recipe.recipeId);
        setSelectedRecipeDetails(details);
        setDetailsStatus("success");
        setIsRecipeDetailOpen(true);
      } catch {
        setDetailsStatus("error");
        setIsRecipeDetailOpen(true);
      }
    })();
  }

  function handleCloseModal(): void {
    setIsRecipeDetailOpen(false);
  }

  return (
    <section className="home-page" aria-labelledby="recipe-search-heading">
      <Box className="home-page__hero">
        <Box
          component="form"
          className="home-page__search"
          onSubmit={handleSubmit}
          sx={{
            ...panelSx,
            display: "grid",
            gap: 1.5,
            p: 3,
            ...fadeSlideIn,
          }}
        >
          <Typography
            id="recipe-search-heading"
            component="h1"
            className="home-page__sr-only"
          >
            Search Cookpad recipes
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              "@media (min-width: 40rem)": {
                gridTemplateColumns: "minmax(0, 1fr) auto",
              },
            }}
          >
            <TextField
              id="recipe-search-keyword"
              label="What would you like to eat for the weekend?"
              name="keyword"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              disabled={searchStatus === "loading"}
              fullWidth
              slotProps={{
                htmlInput: {
                  placeholder: "Try pasta, soup, chicken, or dessert",
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={isSearchDisabled}
              disableElevation
              sx={{
                ...appOwnedBringButtonSx,
                minHeight: "3.5rem",
                px: 3,
                fontWeight: 700,
                whiteSpace: "nowrap",
                "&:hover:not(:disabled)": {
                  ...appOwnedBringButtonSx["&:hover"],
                },
                "&.Mui-disabled": {
                  ...appOwnedBringButtonDisabledSx,
                },
              }}
            >
              {searchStatus === "loading" ? "Searching\u2026" : "Search"}
            </Button>
          </Box>
        </Box>
      </Box>

      {searchStatus === "loading" ? (
        <Paper sx={{ ...panelSx, px: 3, py: 2, ...fadeSlideIn }}>
          <Typography
            role="status"
            sx={{ color: "text.primary", fontWeight: 500 }}
          >
            Searching recipes for &ldquo;{submittedKeyword}&rdquo;&hellip;
          </Typography>
        </Paper>
      ) : null}

      {searchStatus === "error" ? (
        <Paper
          sx={{
            ...panelSx,
            px: 3,
            py: 2,
            borderColor: "rgba(200, 75, 49, 0.3)",
            ...fadeSlideIn,
          }}
        >
          <Typography
            role="alert"
            sx={{ color: "error.main", fontWeight: 600 }}
          >
            We couldn&rsquo;t load recipes right now. Please try again in a
            moment.
          </Typography>
        </Paper>
      ) : null}

      {searchStatus === "empty" ? (
        <Paper sx={{ ...panelSx, px: 3, py: 2, ...fadeSlideIn }}>
          <Typography
            role="status"
            sx={{ color: "text.primary", fontWeight: 500 }}
          >
            No recipes found for &ldquo;{submittedKeyword}&rdquo;. Try another
            keyword.
          </Typography>
        </Paper>
      ) : null}

      {searchStatus === "success" ? (
        <section
          className="home-page__results"
          aria-labelledby="recipe-results-heading"
        >
          <div className="home-page__results-header">
            <h2 id="recipe-results-heading">Recipe ideas</h2>
            <p>
              Showing {recipes.length} match{recipes.length === 1 ? "" : "es"}{" "}
              for{" "}
              <span className="home-page__keyword">
                &ldquo;{submittedKeyword}&rdquo;
              </span>
              .
            </p>
          </div>
          <Box
            component="ul"
            sx={{
              m: 0,
              p: "0 1.5rem 1.5rem",
              listStyle: "none",
              display: "grid",
              gap: 1.5,
            }}
          >
            {recipes.map((recipe, index) => (
              <li key={`${recipe.cookpadUrl ?? recipe.title}-${index}`}>
                <RecipeSummariesListItem
                  recipe={recipe}
                  onViewDetails={() => handleViewDetails(recipe)}
                />
              </li>
            ))}
          </Box>
        </section>
      ) : null}

      <Backdrop
        open={isDetailsLoading}
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.modal + 1,
          backgroundColor: "var(--app-backdrop)",
          backdropFilter: "blur(6px)",
        }}
      >
        <Box
          role="status"
          aria-live="polite"
          sx={{
            display: "grid",
            justifyItems: "center",
            gap: 2,
            px: 3,
            py: 2.5,
            borderRadius: "1.5rem",
            border: "1px solid var(--app-border-strong)",
            backgroundColor: "var(--app-surface-elevated)",
            boxShadow: "var(--app-shadow)",
          }}
        >
          <CircularProgress color="inherit" thickness={4.5} size={42} />
          <Typography sx={{ fontWeight: 700, letterSpacing: "0.01em" }}>
            Loading recipe details…
          </Typography>
        </Box>
      </Backdrop>

      <RecipeCardModal
        recipe={selectedRecipe}
        recipeDetails={selectedRecipeDetails}
        open={isRecipeDetailOpen}
        onClose={handleCloseModal}
      />
    </section>
  );
}

export default HomePage;
