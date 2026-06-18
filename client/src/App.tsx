import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';

import AppShell from './components/AppShell';
import HomePage from './pages/HomePage';
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppShell>
        <HomePage />
      </AppShell>
    </ThemeProvider>
  );
}

export default App;
