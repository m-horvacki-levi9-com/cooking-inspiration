import { createTheme } from '@mui/material/styles';

const paletteTokens = {
  accent: '#a9d776',
  accentSoft: '#d8edbf',
  accentStrong: '#8fbe5f',
  accentContrast: '#1b2a17',
  backgroundBase: '#2c3f2f',
  border: 'rgba(177, 210, 167, 0.26)',
  borderStrong: 'rgba(205, 230, 177, 0.52)',
  surface: 'rgba(35, 54, 39, 0.88)',
  surfaceStrong: 'rgba(42, 62, 46, 0.9)',
  textMuted: '#b6c8b0',
  textPrimary: '#f3f8ef',
  textSecondary: '#d7e5cf',
} as const;

const theme = createTheme({
  palette: {
    mode: 'dark',
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
      disabled: 'rgba(243, 248, 239, 0.42)',
    },
    error: {
      main: '#f88f82',
      light: '#ffd4cf',
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
            WebkitBoxShadow: '0 0 0 100px rgba(42, 62, 46, 0.9) inset',
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
