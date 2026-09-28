import React, { useEffect, useState } from 'react';
import {
  Box,
  Divider,
  Fade,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import KeyboardDoubleArrowUpRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowUpRounded';
import KeyboardDoubleArrowDownRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowDownRounded';

interface FeedScrollNavigatorProps {
  /** Optional container or trigger flag to control visibility */
  enabled?: boolean;
}

export default function FeedScrollNavigator({ enabled = true }: FeedScrollNavigatorProps) {
  const [showNavigator, setShowNavigator] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setShowNavigator(false);
      return;
    }

    const checkScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const totalScrollable = scrollHeight - clientHeight;

      // Only show when page has enough scrollable content (> 250px)
      if (totalScrollable > 250) {
        setShowNavigator(true);
        const percent = Math.min(100, Math.max(0, Math.round((scrollTop / totalScrollable) * 100)));
        setScrollPercent(percent);
      } else {
        setShowNavigator(false);
      }
    };

    // Initial check
    checkScroll();

    window.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      window.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [enabled]);

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleScrollToBottom = () => {
    const scrollTarget = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );

    window.scrollTo({
      top: scrollTarget,
      behavior: 'smooth',
    });
  };

  return (
    <Fade in={showNavigator} timeout={300}>
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          bottom: { xs: 24, sm: 32 },
          right: { xs: 16, sm: 28 },
          zIndex: 1200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(10px)',
          border: '1px solid #EFE6E8',
          borderRadius: '32px',
          boxShadow: '0 8px 30px rgba(36, 16, 25, 0.12), 0 2px 10px rgba(232, 51, 109, 0.08)',
          p: 0.5,
          gap: 0.25,
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          '&:hover': {
            borderColor: '#E8336D',
            boxShadow: '0 10px 36px rgba(232, 51, 109, 0.18)',
          },
        }}
      >
        {/* Scroll All The Way Up Button */}
        <Tooltip title="Scroll all the way to top" placement="left" arrow>
          <IconButton
            onClick={handleScrollToTop}
            aria-label="Scroll all the way to top"
            size="small"
            sx={{
              color: '#A31346',
              bgcolor: 'transparent',
              p: 1.1,
              borderRadius: '50%',
              transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: '#FFD9E4',
                color: '#E8336D',
                transform: 'translateY(-2px)',
              },
              '&:active': {
                transform: 'scale(0.92)',
              },
            }}
          >
            <KeyboardDoubleArrowUpRoundedIcon sx={{ fontSize: 24 }} />
          </IconButton>
        </Tooltip>

        {/* Scroll Percentage Indicator */}
        <Box
          sx={{
            py: 0.3,
            px: 0.75,
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontFamily: "'Archivo', sans-serif",
              fontWeight: 700,
              fontSize: '0.68rem',
              color: scrollPercent > 0 && scrollPercent < 100 ? '#E8336D' : '#8A6E76',
              letterSpacing: '-0.02em',
              minWidth: 26,
              textAlign: 'center',
            }}
          >
            {scrollPercent === 0 ? 'TOP' : scrollPercent === 100 ? 'END' : `${scrollPercent}%`}
          </Typography>
        </Box>

        <Divider sx={{ width: '22px', borderColor: '#EFE6E8', my: 0.25 }} />

        {/* Scroll All The Way Down Button */}
        <Tooltip title="Scroll all the way to bottom" placement="left" arrow>
          <IconButton
            onClick={handleScrollToBottom}
            aria-label="Scroll all the way to bottom"
            size="small"
            sx={{
              color: '#A31346',
              bgcolor: 'transparent',
              p: 1.1,
              borderRadius: '50%',
              transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: '#FFD9E4',
                color: '#E8336D',
                transform: 'translateY(2px)',
              },
              '&:active': {
                transform: 'scale(0.92)',
              },
            }}
          >
            <KeyboardDoubleArrowDownRoundedIcon sx={{ fontSize: 24 }} />
          </IconButton>
        </Tooltip>
      </Paper>
    </Fade>
  );
}
