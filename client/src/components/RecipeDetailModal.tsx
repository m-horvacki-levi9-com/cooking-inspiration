import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import type { RecipeDetails } from '../services/recipeDetailsService';
import type { RecipeSearchListItem } from '../services/recipeSearchService';
import { appOwnedBringButtonSx } from '../styles/bringButtonStyles';

type RecipeDetailModalProps = {
  recipe: RecipeSearchListItem | null;
  recipeDetails: RecipeDetails | null;
  detailsStatus: 'idle' | 'loading' | 'success' | 'error';
  open: boolean;
  onClose: () => void;
};

const DESCRIPTION_FALLBACK = 'Description coming soon.';
const METHOD_FALLBACK = 'Method steps are unavailable for this recipe.';

const dialogPaperSx = {
  backgroundColor: 'rgba(255, 255, 255, 0.97)',
  border: '1px solid var(--app-border)',
  borderRadius: '1.75rem',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 32px 80px rgba(74, 101, 49, 0.18)',
  m: { xs: 1.5, sm: 3 },
  maxHeight: { xs: 'calc(100% - 1.5rem)', sm: 'calc(100% - 4rem)' },
} as const;

const sectionCardSx = {
  p: 2,
  border: '1px solid var(--app-border)',
  borderRadius: '1.125rem',
  backgroundColor: 'rgba(240, 247, 231, 0.96)',
} as const;

function RecipeDetailModal({
  recipe,
  recipeDetails,
  detailsStatus,
  open,
  onClose,
}: RecipeDetailModalProps) {
  const handleDialogClose = (_event: unknown, reason: string): void => {
    if (reason !== 'backdropClick') {
      onClose();
    }
  };

  if (!recipe) {
    return null;
  }

  const resolvedRecipe = recipeDetails ?? recipe;
  const ingredients = recipeDetails?.ingredients ?? [];
  const hasIngredients = ingredients.length > 0;
  const description = resolvedRecipe.description ?? DESCRIPTION_FALLBACK;
  const methodSteps = recipeDetails?.methodSteps ?? [];
  const hasMethodSteps = methodSteps.length > 0;
  const isLoading = detailsStatus === 'loading';

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      aria-labelledby="recipe-detail-title"
      fullWidth
      maxWidth="sm"
      scroll="paper"
      sx={{
        '& .MuiDialog-paper': dialogPaperSx,
        '& .MuiBackdrop-root': {
          backgroundColor: 'var(--app-backdrop)',
          backdropFilter: 'blur(4px)',
        },
        '@media (prefers-reduced-motion: reduce)': {
          '& .MuiDialog-paper, & .MuiFade-root': {
            transition: 'none !important',
            animation: 'none !important',
          },
        },
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
          pb: 1.5,
          pt: 2,
          px: 2.5,
          borderBottom: '1px solid rgba(127, 168, 73, 0.18)',
          background:
            'linear-gradient(180deg, rgba(231, 245, 198, 0.9) 0%, rgba(255, 255, 255, 0) 100%)',
        }}
      >
        <Typography
          id="recipe-detail-title"
          component="h2"
          variant="h6"
          sx={{
            fontWeight: 700,
            color: '#1d2e1a',
            lineHeight: 1.3,
            flex: 1,
            m: 0,
          }}
        >
          {resolvedRecipe.title}
        </Typography>

        <IconButton
          aria-label="Close"
          onClick={onClose}
          size="small"
          sx={{
            color: '#486048',
            flexShrink: 0,
            mt: '-2px',
            minWidth: '2.75rem',
            minHeight: '2.75rem',
            '&:hover': {
              color: 'var(--app-text-primary)',
              background: 'var(--app-accent-soft)',
            },
          }}
        >
          ✕
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {resolvedRecipe.imageUrl ? (
          <Box
            component="img"
            src={resolvedRecipe.imageUrl}
            alt={resolvedRecipe.title}
            sx={{
              width: '100%',
              maxHeight: 240,
              objectFit: 'cover',
              display: 'block',
              background: 'var(--app-surface-muted)',
            }}
          />
        ) : null}

        <Box sx={{ p: 2.5, display: 'grid', gap: 3 }}>
          <Typography
            variant="body1"
            sx={{ color: 'var(--app-text-secondary)', lineHeight: 1.75, m: 0 }}
          >
            {description}
          </Typography>

          <Box sx={sectionCardSx}>
            <Typography
              component="h3"
              variant="subtitle1"
              sx={{ fontWeight: 700, color: 'var(--app-text-primary)', mb: 1.5, m: 0 }}
            >
              Ingredients
            </Typography>

            {isLoading ? (
              <Typography variant="body2" sx={{ color: 'var(--app-text-secondary)', mt: 1 }}>
                Loading ingredients&hellip;
              </Typography>
            ) : hasIngredients ? (
              <Box
                component="ul"
                sx={{
                  m: 0,
                  mt: 1,
                  pl: 2.5,
                  color: 'var(--app-text-secondary)',
                  display: 'grid',
                  gap: 0.5,
                }}
              >
                {ingredients.map((ingredient, index) => (
                  <li key={`${resolvedRecipe.cookpadUrl}-ingredient-${index}`}>{ingredient}</li>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: 'var(--app-text-secondary)', mt: 1 }}>
                Ingredients coming soon.
              </Typography>
            )}
          </Box>

          <Box sx={sectionCardSx}>
            <Typography
              component="h3"
              variant="subtitle1"
              sx={{ fontWeight: 700, color: 'var(--app-text-primary)', m: 0 }}
            >
              Method
            </Typography>

            {isLoading ? (
              <Typography variant="body2" sx={{ color: 'var(--app-text-secondary)', mt: 1 }}>
                Loading method steps&hellip;
              </Typography>
            ) : hasMethodSteps ? (
              <Box
                component="ol"
                aria-label="Method steps"
                sx={{
                  m: 0,
                  mt: 1,
                  pl: 2.5,
                  color: 'var(--app-text-secondary)',
                  display: 'grid',
                  gap: 0.5,
                }}
              >
                {methodSteps.map((step, index) => (
                  <li key={`${resolvedRecipe.cookpadUrl}-step-${index}`}>{step}</li>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: 'var(--app-text-secondary)', mt: 1 }}>
                {METHOD_FALLBACK}
              </Typography>
            )}
          </Box>

          {resolvedRecipe.cookpadUrl ? (
            <Box sx={{ display: 'flex' }}>
              <Link
                href={resolvedRecipe.cookpadUrl}
                target="_blank"
                rel="noreferrer"
                underline="none"
                sx={{
                  ...appOwnedBringButtonSx,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '2.5rem',
                  px: 2,
                  fontWeight: 700,
                }}
              >
                View recipe
              </Link>
            </Box>
          ) : null}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default RecipeDetailModal;
