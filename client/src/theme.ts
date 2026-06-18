import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#c084fc',
      light: '#f0abfc',
      dark: '#a855f7',
      contrastText: '#020617',
    },
    background: {
      default: '#0f172a',
      paper: 'rgba(15, 23, 42, 0.72)',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#e2e8f0',
      disabled: 'rgba(248, 250, 252, 0.42)',
    },
    error: {
      main: '#f87171',
      light: '#fecaca',
    },
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
    borderRadius: 12,
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
          borderRadius: '1rem',
          backgroundColor: 'rgba(15, 23, 42, 0.72)',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(148, 163, 184, 0.55)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(192, 132, 252, 0.75)',
            borderWidth: '2px',
          },
          '&.Mui-disabled': {
            opacity: 0.65,
          },
        },
        notchedOutline: {
          borderColor: 'rgba(148, 163, 184, 0.28)',
        },
        input: {
          color: '#f8fafc',
          '&::placeholder': {
            color: '#94a3b8',
            opacity: 1,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#cbd5e1',
          fontWeight: 600,
          '&.Mui-focused': {
            color: '#e0aaff',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: '1rem',
          letterSpacing: 'normal',
        },
      },
    },
  },
});

export default theme;
