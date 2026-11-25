import '@mantine/core/styles.css';
import '@fontsource-variable/inter';
import '@fontsource-variable/manrope';
import './styles.css';
import { MantineProvider } from '@mantine/core';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { theme } from './theme';

createRoot(document.getElementById('root')!).render(
  <MantineProvider theme={theme}>
    <App />
  </MantineProvider>,
);
