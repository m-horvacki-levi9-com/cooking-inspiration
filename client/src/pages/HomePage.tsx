import type { FormEvent } from 'react';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import RecipeCard from '../components/RecipeCard';
import { searchRecipes, type RecipeSummary } from '../services/recipeSearchService';
import '../styles/home-page.css';

type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

const glassSx = {
  background: 'rgba(15, 23, 42, 0.72)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: '1.5rem',
  boxShadow: '0 24px 48px rgba(15, 23, 42, 0.28)',
  backdropFilter: 'blur(14px)',
} as const;

const fadeSlideIn = {
  '@keyframes fadeSlideIn': {
    from: { opacity: 0, transform: 'translateY(12px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    opacity: 1,
  },
  animation: 'fadeSlideIn 0.45s ease forwards',
} as const;

function HomePage() {
  const [keyword, setKeyword] = useState('');
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [submittedKeyword, setSubmittedKeyword] = useState('');

  const trimmedKeyword = keyword.trim();
  const isSearchDisabled = trimmedKeyword.length === 0 || searchStatus === 'loading';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSearchDisabled) {
      return;
    }

    setSearchStatus('loading');
    setSubmittedKeyword(trimmedKeyword);
    setRecipes([]);

    try {
      const foundRecipes = await searchRecipes(trimmedKeyword);

      setRecipes(foundRecipes);
      setSearchStatus(foundRecipes.length > 0 ? 'success' : 'empty');
    } catch {
      setSearchStatus('error');
    }
  }

  return (
    <section className="home-page" aria-labelledby="recipe-search-heading">
      <Paper sx={{ ...glassSx, p: 3, ...fadeSlideIn }}>
        <Typography
          id="recipe-search-heading"
          variant="h2"
          sx={{ mb: 1.5, fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
        >
          Find a recipe to cook tonight
        </Typography>
        <Typography sx={{ color: 'text.secondary' }}>
          Search by ingredient, dish, or craving to see up to four Cookpad recipe ideas.
        </Typography>
      </Paper>

      <Paper
        sx={{
          ...glassSx,
          p: 3,
          ...fadeSlideIn,
          animationDelay: '0.1s',
          opacity: 0,
          '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 1 },
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'grid',
            gap: 1.5,
            '@media (min-width: 40rem)': {
              gridTemplateColumns: 'minmax(0, 1fr) auto',
            },
          }}
        >
          <TextField
            id="recipe-search-keyword"
            label="Search recipes by keyword"
            name="keyword"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            disabled={searchStatus === 'loading'}
            fullWidth
            slotProps={{
              htmlInput: {
                placeholder: 'Try pasta, soup, chicken, or dessert',
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={isSearchDisabled}
            disableElevation
            sx={{
              minHeight: '3.5rem',
              px: 3,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #c084fc 0%, #f0abfc 100%)',
              color: '#020617',
              transition: 'transform 0.2s ease, opacity 0.2s ease',
              whiteSpace: 'nowrap',
              '&:hover:not(:disabled)': {
                background: 'linear-gradient(135deg, #c084fc 0%, #f0abfc 100%)',
                transform: 'translateY(-1px)',
                boxShadow: 'none',
              },
              '&.Mui-disabled': {
                opacity: 0.65,
                color: '#020617',
                background: 'linear-gradient(135deg, #c084fc 0%, #f0abfc 100%)',
              },
            }}
          >
            {searchStatus === 'loading' ? 'Searching\u2026' : 'Search'}
          </Button>
        </Box>
      </Paper>

      {searchStatus === 'loading' ? (
        <Paper sx={{ ...glassSx, px: 3, py: 2, ...fadeSlideIn }}>
          <Typography role="status" sx={{ color: 'text.primary', fontWeight: 500 }}>
            Searching recipes for &ldquo;{submittedKeyword}&rdquo;&hellip;
          </Typography>
        </Paper>
      ) : null}

      {searchStatus === 'error' ? (
        <Paper
          sx={{
            ...glassSx,
            px: 3,
            py: 2,
            borderColor: 'rgba(248, 113, 113, 0.35)',
            ...fadeSlideIn,
          }}
        >
          <Typography role="alert" sx={{ color: 'error.light', fontWeight: 500 }}>
            We couldn&rsquo;t load recipes right now. Please try again in a moment.
          </Typography>
        </Paper>
      ) : null}

      {searchStatus === 'empty' ? (
        <Paper sx={{ ...glassSx, px: 3, py: 2, ...fadeSlideIn }}>
          <Typography role="status" sx={{ color: 'text.primary', fontWeight: 500 }}>
            No recipes found for &ldquo;{submittedKeyword}&rdquo;. Try another keyword.
          </Typography>
        </Paper>
      ) : null}

      {searchStatus === 'success' ? (
        <section className="home-page__results" aria-labelledby="recipe-results-heading">
          <div className="home-page__results-header">
            <h2 id="recipe-results-heading">Recipe ideas</h2>
            <p>
              Showing {recipes.length} match{recipes.length === 1 ? '' : 'es'} for &ldquo;
              {submittedKeyword}&rdquo;.
            </p>
          </div>
          <div className="home-page__grid">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.cookpadUrl} recipe={recipe} />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

export default HomePage;
