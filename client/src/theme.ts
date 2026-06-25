import { createTheme } from '@mui/material/styles';

const paletteTokens = {
  accent: '#b8de6d',
  accentSoft: '#e7f5c6',
  accentStrong: '#9dc94f',
  accentContrast: '#1c2a15',
  backgroundBase: '#f2f7ea',
  border: 'rgba(127, 168, 73, 0.22)',
  borderStrong: 'rgba(127, 168, 73, 0.38)',
  surface: 'rgba(250, 252, 246, 0.94)',
  surfaceStrong: 'rgba(255, 255, 255, 0.94)',
  textMuted: '#637862',
  textPrimary: '#1d2e1a',
  textSecondary: '#486048',
} as const;

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: paletteTokens.accent,
      light: paletteTokens.accentSoft,
      dark: paletteTokens.accentStrong,
      contrastText: paletteTokens.accentContrast,
    },
    background: {
      default: paletteTokens.backgroundBase,
      paper: paletteTokens.surface,
    },
    text: {
      primary: paletteTokens.textPrimary,
      secondary: paletteTokens.textSecondary,
      disabled: 'rgba(29, 46, 26, 0.42)',
    },
    error: {
      main: '#c84b31',
      light: '#f6d0c9',
    },
    divider: paletteTokens.border,
  },
  typography: {
    fontFamily:
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeightMedium: 600,
    fontWeightBold: 700,
    h2: {
      fontWeight: 700,
      lineHeight: 1.2,
    },
    body1: {
      lineHeight: 1.6,
    },
    body2: {
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '1.125rem',
          backgroundColor: paletteTokens.surfaceStrong,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: paletteTokens.borderStrong,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: paletteTokens.accentStrong,
            borderWidth: '2px',
          },
          '&.Mui-disabled': {
            opacity: 0.65,
          },
        },
        notchedOutline: {
          borderColor: paletteTokens.border,
        },
        input: {
          color: paletteTokens.textPrimary,
          caretColor: paletteTokens.textPrimary,
          '&::placeholder': {
            color: paletteTokens.textMuted,
            opacity: 1,
          },
          '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus': {
            borderRadius: '1.125rem',
            caretColor: paletteTokens.textPrimary,
            WebkitBoxShadow: '0 0 0 100px rgba(255, 255, 255, 0.94) inset',
            WebkitTextFillColor: paletteTokens.textPrimary,
            transition: 'background-color 5000s ease-in-out 0s',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: paletteTokens.textSecondary,
          fontWeight: 600,
          '&.Mui-focused': {
            color: paletteTokens.textPrimary,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: '999px',
          letterSpacing: 'normal',
        },
      },
    },
  },
});

export default theme;
