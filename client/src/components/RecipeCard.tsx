import { useEffect, useRef } from 'react';

import type { RecipeSummary } from '../services/recipeSearchService';

type RecipeCardProps = {
  recipe: RecipeSummary;
};

function RecipeCard({ recipe }: RecipeCardProps) {
  const ingredients = recipe.ingredients ?? [];
  const hasIngredients = ingredients.length > 0;
  const bringButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const bringButtonElement = bringButtonRef.current;
    const bringImportWidget = window.bringwidgets?.import;

    if (!recipe.cookpadUrl || !bringButtonElement || !bringImportWidget?.render) {
      return;
    }

    bringImportWidget.render(bringButtonElement, {
      url: recipe.cookpadUrl,
      language: 'en',
      theme: 'light',
    });
  }, [recipe.cookpadUrl]);

  return (
    <article className="recipe-card">
      {recipe.imageUrl ? (
        <img className="recipe-card__image" src={recipe.imageUrl} alt={recipe.title} />
      ) : (
        <div className="recipe-card__image recipe-card__image--placeholder" aria-hidden="true">
          <span>Image coming soon</span>
        </div>
      )}
      <div className="recipe-card__content">
        <h3>{recipe.title}</h3>
        <p>{recipe.description ?? 'Description coming soon.'}</p>
        <div className="recipe-card__details">
          <h4 className="recipe-card__details-heading">Ingredients</h4>
          {hasIngredients ? (
            <ul className="recipe-card__ingredients">
              {ingredients.map((ingredient, index) => (
                <li key={`${recipe.cookpadUrl}-ingredient-${index}`}>{ingredient}</li>
              ))}
            </ul>
          ) : (
            <p className="recipe-card__ingredients-fallback">Ingredients coming soon.</p>
          )}
        </div>
        <div className="recipe-card__actions">
          <a
            className="recipe-card__link"
            href={recipe.cookpadUrl}
            target="_blank"
            rel="noreferrer"
          >
            View recipe
          </a>
          {recipe.cookpadUrl ? (
            <div className="recipe-card__bring-slot">
              <div ref={bringButtonRef}>
                <a
                  className="recipe-card__bring-link"
                  href="https://www.getbring.com/en/home"
                  rel="noreferrer"
                  target="_blank"
                >
                  Import to Bring!
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default RecipeCard;
