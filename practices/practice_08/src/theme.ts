import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'iris',
  primaryShade: 7,
  colors: {
    iris: ['#f4f1ff', '#e9e3ff', '#d7cbff', '#bfaffc', '#a48cf8', '#8869ef', '#7050e2', '#4c36ca', '#402db1', '#352693'],
  },
  fontFamily: 'Inter Variable, system-ui, sans-serif',
  headings: { fontFamily: 'Manrope Variable, system-ui, sans-serif', fontWeight: '800' },
  defaultRadius: 'md',
  spacing: { xs: '0.5rem', sm: '0.75rem', md: '1rem', lg: '1.25rem', xl: '1.75rem' },
  components: {
    Button: { defaultProps: { size: 'md', radius: 'md' } },
    TextInput: { defaultProps: { size: 'md' } },
    Textarea: { defaultProps: { size: 'md' } },
  },
});
