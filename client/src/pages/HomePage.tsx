import type { FormEvent } from 'react';
import { useState } from 'react';

import RecipeCard from '../components/RecipeCard';
import { searchRecipes, type RecipeSummary } from '../services/recipeSearchService';
import '../styles/home-page.css';

type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

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
      <div className="home-page__intro">
        <h2 id="recipe-search-heading">Find a recipe to cook tonight</h2>
        <p>Search by ingredient, dish, or craving to see up to four Cookpad recipe ideas.</p>
      </div>

      <form className="home-page__search" onSubmit={handleSubmit}>
        <label className="home-page__label" htmlFor="recipe-search-keyword">
          Search recipes by keyword
        </label>
        <div className="home-page__search-row">
          <input
            id="recipe-search-keyword"
            className="home-page__input"
            type="text"
            name="keyword"
            value={keyword}
            placeholder="Try pasta, soup, chicken, or dessert"
            onChange={(event) => setKeyword(event.target.value)}
            disabled={searchStatus === 'loading'}
          />
          <button className="home-page__button" type="submit" disabled={isSearchDisabled}>
            {searchStatus === 'loading' ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {searchStatus === 'loading' ? (
        <p className="home-page__message" role="status">
          Searching recipes for “{submittedKeyword}”…
        </p>
      ) : null}

      {searchStatus === 'error' ? (
        <p className="home-page__message home-page__message--error" role="alert">
          We couldn’t load recipes right now. Please try again in a moment.
        </p>
      ) : null}

      {searchStatus === 'empty' ? (
        <p className="home-page__message" role="status">
          No recipes found for “{submittedKeyword}”. Try another keyword.
        </p>
      ) : null}

      {searchStatus === 'success' ? (
        <section className="home-page__results" aria-labelledby="recipe-results-heading">
          <div className="home-page__results-header">
            <h2 id="recipe-results-heading">Recipe ideas</h2>
            <p>
              Showing {recipes.length} match{recipes.length === 1 ? '' : 'es'} for "
              {submittedKeyword}”.
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
