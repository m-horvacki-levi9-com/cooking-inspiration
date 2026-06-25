import { useEffect, useRef } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import type { RecipeSummary } from '../services/recipeSearchService';
import { appOwnedBringButtonSx } from '../styles/bringButtonStyles';
import { formatDescriptionPreview } from '../viewModels/recipeListItem';

type RecipeListItemProps = {
  recipe: RecipeSummary;
  onViewDetails: () => void;
};

const thumbnailSx = {
  width: { xs: 80, sm: 96 },
  height: { xs: 80, sm: 96 },
  flexShrink: 0,
  borderRadius: '0.75rem',
  objectFit: 'cover' as const,
  display: 'grid',
  placeItems: 'center',
  background: 'linear-gradient(135deg, rgba(184, 222, 109, 0.52), rgba(231, 245, 198, 0.88))',
} as const;

const bringLinkSx = {
  ...appOwnedBringButtonSx,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '2.5rem',
  px: 2,
  textDecoration: 'none',
  fontWeight: 700,
} as const;

function RecipeListItem({ recipe, onViewDetails }: RecipeListItemProps) {
  const bringButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const bringButtonElement = bringButtonRef.current;
    const bringScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://platform.getbring.com/widgets/import.js"]',
    );
    let widgetRendered = false;

    if (!recipe.cookpadUrl || !bringButtonElement) {
      return;
    }

    const renderBringWidget = () => {
      if (widgetRendered) {
        return;
      }
      const bringImportWidget = window.bringwidgets?.import;
      if (!bringImportWidget?.render) {
        return;
      }
      bringImportWidget.render(bringButtonElement, {
        url: recipe.cookpadUrl,
        language: 'en',
        theme: 'light',
      });
      widgetRendered = true;
    };

    renderBringWidget();

    if (!bringScript || widgetRendered) {
      return;
    }

    bringScript.addEventListener('load', renderBringWidget);

    return () => {
      bringScript.removeEventListener('load', renderBringWidget);
    };
  }, [recipe.cookpadUrl]);

  const descriptionPreview = formatDescriptionPreview(recipe.description);

  return (
    <Box
      component="article"
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '5rem minmax(0, 1fr)',
          sm: '6rem minmax(0, 1fr)',
        },
        gap: 2,
        alignItems: 'start',
        p: 2,
        minHeight: { xs: '9rem', sm: '9.5rem' },
        border: '1px solid var(--app-border)',
        borderRadius: '1.5rem',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        boxShadow: 'var(--app-shadow-soft)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
        },
        '&:hover': {
          borderColor: 'var(--app-border-strong)',
          boxShadow: 'var(--app-shadow)',
        },
      }}
    >
      {recipe.imageUrl ? (
        <Box
          component="img"
          src={recipe.imageUrl}
          alt={recipe.title}
          sx={thumbnailSx}
        />
      ) : (
        <Box sx={thumbnailSx} aria-hidden="true">
          <Typography
            component="span"
            variant="caption"
            sx={{ px: 1, textAlign: 'center', color: 'var(--app-text-secondary)', fontWeight: 600 }}
          >
            Image coming soon
          </Typography>
        </Box>
      )}

      <Box sx={{ flex: 1, minWidth: 0, display: 'grid', gap: 0.75 }}>
        <Typography
          component="h3"
          variant="body1"
          sx={{
            fontWeight: 700,
            lineHeight: 1.3,
            m: 0,
            minHeight: '2.6rem',
            color: 'var(--app-text-primary)',
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
          }}
        >
          {recipe.title}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: 'var(--app-text-secondary)',
            m: 0,
            minHeight: '3rem',
            lineHeight: 1.5,
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
          }}
        >
          {descriptionPreview}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
          <Button
            variant="contained"
            size="small"
            onClick={onViewDetails}
            disableElevation
            sx={{
              ...appOwnedBringButtonSx,
              minHeight: '2.5rem',
              px: 2,
            }}
          >
            View details
          </Button>

          {recipe.cookpadUrl ? (
            <Box sx={{ display: 'inline-flex' }}>
              <div ref={bringButtonRef}>
                <Box
                  component="a"
                  href="https://www.getbring.com/en/home"
                  rel="noreferrer"
                  target="_blank"
                  sx={bringLinkSx}
                >
                  Import to Bring!
                </Box>
              </div>
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

export default RecipeListItem;
