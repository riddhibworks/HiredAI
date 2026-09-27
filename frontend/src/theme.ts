import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#FFF9FA', // --color-bg
      paper: '#FFFFFF',   // --color-surface
    },
    text: {
      primary: '#241019',   // --color-ink
      secondary: '#8A6E76', // --color-muted
    },
    primary: {
      main: '#E8336D',     // --color-accent
      dark: '#A31346',     // --color-accent-deep
      light: '#FFD9E4',    // --color-accent-soft
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#A31346',
      light: '#FFD9E4',
      contrastText: '#FFFFFF',
    },
    divider: '#EFE6E8', // --color-border
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: {
      fontFamily: "'Archivo', sans-serif",
      fontWeight: 800,
      color: '#241019',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: "'Archivo', sans-serif",
      fontWeight: 800,
      color: '#241019',
      letterSpacing: '-0.02em',
    },
    h3: {
      fontFamily: "'Archivo', sans-serif",
      fontWeight: 700,
      color: '#241019',
      letterSpacing: '-0.015em',
    },
    h4: {
      fontFamily: "'Archivo', sans-serif",
      fontWeight: 700,
      color: '#241019',
      letterSpacing: '-0.01em',
    },
    h5: {
      fontFamily: "'Archivo', sans-serif",
      fontWeight: 700,
      color: '#241019',
    },
    h6: {
      fontFamily: "'Archivo', sans-serif",
      fontWeight: 600,
      color: '#241019',
    },
    subtitle1: {
      fontFamily: "'Inter', sans-serif",
      color: '#8A6E76',
      lineHeight: 1.55,
    },
    subtitle2: {
      fontFamily: "'Archivo', sans-serif",
      fontWeight: 600,
      color: '#241019',
    },
    body1: {
      fontFamily: "'Inter', sans-serif",
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#241019',
    },
    body2: {
      fontFamily: "'Inter', sans-serif",
      fontSize: '0.9rem',
      lineHeight: 1.55,
      color: '#8A6E76',
    },
    button: {
      fontFamily: "'Archivo', sans-serif",
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          WebkitTapHighlightColor: 'transparent',
        },
        '*:focus': {
          outline: 'none !important',
        },
        '*:focus-visible': {
          outline: 'none !important',
        },
        body: {
          backgroundColor: '#FFF9FA',
          color: '#241019',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 22px',
          fontSize: '0.95rem',
          fontWeight: 600,
          boxShadow: 'none',
          textTransform: 'none',
          transition: 'all 0.18s ease-in-out',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          backgroundColor: '#E8336D',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#A31346',
          },
          '&:focus-visible': {
            outline: '2px solid #A31346',
            outlineOffset: '2px',
          },
        },
        outlinedPrimary: {
          borderColor: '#E8336D',
          color: '#A31346', // high emphasis on light bg for WCAG compliance
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            borderColor: '#A31346',
            backgroundColor: '#FFF0F4',
          },
        },
        textPrimary: {
          color: '#A31346',
          '&:hover': {
            backgroundColor: '#FFF0F4',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          border: '1px solid #EFE6E8',
          boxShadow: '0 2px 8px rgba(36, 16, 25, 0.03)',
          borderRadius: 14,
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            borderColor: '#D8C3C9',
            boxShadow: '0 4px 16px rgba(36, 16, 25, 0.06)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          border: '1px solid #EFE6E8',
          boxShadow: '0 2px 8px rgba(36, 16, 25, 0.03)',
          borderRadius: 14,
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        square: true,
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: '0 !important',
          border: 'none',
          borderBottom: '1px solid #EFE6E8',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          borderRadius: 8,
          outline: 'none !important',
        },
        filledPrimary: {
          backgroundColor: '#FFD9E4',
          color: '#A31346',
          fontWeight: 600,
        },
        outlinedPrimary: {
          borderColor: '#E8336D',
          color: '#A31346',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
          outline: 'none !important',
          boxShadow: 'none !important',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#EFE6E8',
            borderWidth: '1.5px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#D8C3C9',
          },
          '&.Mui-focused': {
            backgroundColor: '#FFFFFF',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#E8336D',
            borderWidth: '1.5px',
            boxShadow: 'none',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          outline: 'none !important',
          boxShadow: 'none !important',
          '&:focus': {
            outline: 'none !important',
            backgroundColor: 'transparent',
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 6px',
          outline: 'none !important',
          boxShadow: 'none !important',
          WebkitTapHighlightColor: 'transparent',
          '&:focus': {
            outline: 'none !important',
            boxShadow: 'none !important',
            backgroundColor: '#FFF9FA',
          },
          '&:focus-visible': {
            outline: 'none !important',
            boxShadow: 'none !important',
          },
          '&.Mui-selected': {
            backgroundColor: '#FFF0F4',
            color: '#A31346',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#FFE5EC',
            },
            '&.Mui-focused': {
              backgroundColor: '#FFE5EC',
            },
          },
          '&:hover': {
            backgroundColor: '#FFF9FA',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#8A6E76',
          textTransform: 'none',
          '&.Mui-focused': {
            color: '#A31346',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: "'Archivo', sans-serif",
          fontWeight: 600,
          fontSize: '0.95rem',
          textTransform: 'none',
          color: '#8A6E76',
          minHeight: 48,
          outline: 'none !important',
          '&.Mui-selected': {
            color: '#A31346',
            fontWeight: 700,
          },
          '&:hover': {
            color: '#241019',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#E8336D',
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
  },
});
