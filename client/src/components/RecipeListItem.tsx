import { useEffect, useRef } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import type { RecipeSummary } from '../services/recipeSearchService';
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
  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.35), rgba(59, 130, 246, 0.25))',
} as const;

const bringLinkSx = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '2.75rem',
  px: 2,
  borderRadius: '999px',
  textDecoration: 'none',
  fontWeight: 700,
  color: '#020617',
  background: 'linear-gradient(135deg, #c084fc 0%, #f0abfc 100%)',
  '&:focus-visible': {
    outline: '3px solid rgba(192, 132, 252, 0.6)',
    outlineOffset: '2px',
  },
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
        border: '1px solid rgba(148, 163, 184, 0.18)',
        borderRadius: '1.25rem',
        background: 'rgba(30, 41, 59, 0.88)',
        transition: 'border-color 0.2s ease',
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
        },
        '&:hover': {
          borderColor: 'rgba(192, 132, 252, 0.35)',
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
            sx={{ px: 1, textAlign: 'center', color: '#e2e8f0', fontWeight: 600 }}
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
            color: '#f8fafc',
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
            color: '#cbd5e1',
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
            variant="outlined"
            size="small"
            onClick={onViewDetails}
            sx={{
              borderColor: 'rgba(192, 132, 252, 0.45)',
              color: '#f8fafc',
              borderRadius: '999px',
              fontWeight: 700,
              minHeight: '2.75rem',
              px: 2,
              '&:hover': {
                borderColor: 'rgba(192, 132, 252, 0.7)',
                background: 'rgba(192, 132, 252, 0.1)',
              },
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
