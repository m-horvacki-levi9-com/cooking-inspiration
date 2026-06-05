import type { RecipeSummary } from '../services/recipeSearchService';

type RecipeCardProps = {
  recipe: RecipeSummary;
};

function RecipeCard({ recipe }: RecipeCardProps) {
  const ingredients = recipe.ingredients ?? [];
  const hasIngredients = ingredients.length > 0;

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
        <a
          className="recipe-card__link"
          href={recipe.cookpadUrl}
          target="_blank"
          rel="noreferrer"
        >
          View recipe
        </a>
      </div>
    </article>
  );
}

export default RecipeCard;
