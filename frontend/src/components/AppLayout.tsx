import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import WorkIcon from '@mui/icons-material/Work';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import DescriptionIcon from '@mui/icons-material/Description';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import { useAuthStore } from '../store/authStore';
import { useJobStore } from '../store/jobStore';
import { savedJobsApi } from '../api/savedJobs';
import Footer from './Footer';

const NAV_ITEMS = [
  { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
  { label: 'Job Feed', path: '/jobs', icon: <WorkIcon fontSize="small" /> },
  { label: 'Saved Jobs', path: '/saved-jobs', icon: <BookmarkIcon fontSize="small" /> },
  { label: 'Resumes', path: '/resumes', icon: <DescriptionIcon fontSize="small" /> },
  { label: 'Job Sources', path: '/job-sources', icon: <RssFeedIcon fontSize="small" /> },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, token, logout } = useAuthStore();
  const { savedJobs, setSavedJobs, savedJobsLoadedAt } = useJobStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (token && savedJobsLoadedAt === 0) {
      savedJobsApi.list().then(setSavedJobs).catch(() => undefined);
    }
  }, [token, savedJobsLoadedAt, setSavedJobs]);

  // Find matching nav path or default to '/' exact check
  const currentTab = NAV_ITEMS.find((item) => {
    if (item.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.path);
  })?.path ?? false;

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#FFF9FA' }}>
      <AppBar
        position="sticky"
        elevation={0}
        square
        sx={{
          borderRadius: '0 !important',
          border: 'none',
          borderBottom: '1px solid #EFE6E8',
          bgcolor: '#FFFFFF',
          color: '#241019',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1, sm: 0 }, justifyContent: 'space-between' }}>
            {/* Brand Logo */}
            <Typography
              variant="h6"
              onClick={() => navigate('/')}
              sx={{
                fontFamily: "'Archivo', sans-serif",
                fontWeight: 800,
                fontSize: { xs: '1.2rem', sm: '1.35rem' },
                color: '#241019',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                mr: { xs: 1, md: 3 },
                letterSpacing: '-0.02em',
              }}
            >
              Hired<Box component="span" sx={{ color: '#E8336D' }}>AI</Box>
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: '#E8336D',
                  ml: 0.5,
                  mb: 0.25,
                }}
              />
            </Typography>

            {/* Desktop Navigation Tabs */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, flexGrow: 1 }}>
              <Tabs
                value={currentTab}
                sx={{
                  minHeight: 64,
                  '& .MuiTabs-flexContainer': {
                    gap: 0.5,
                  },
                }}
              >
                {NAV_ITEMS.map((item) => (
                  <Tab
                    key={item.path}
                    label={
                      item.path === '/saved-jobs' && savedJobs.length > 0 ? (
                        <Box display="flex" alignItems="center" gap={0.75}>
                          <span>{item.label}</span>
                          <Chip
                            label={savedJobs.length}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              bgcolor: '#FFD9E4',
                              color: '#A31346',
                            }}
                          />
                        </Box>
                      ) : (
                        item.label
                      )
                    }
                    value={item.path}
                    onClick={() => navigate(item.path)}
                    sx={{
                      minHeight: 64,
                      px: 2,
                      fontSize: '0.95rem',
                    }}
                  />
                ))}
              </Tabs>
            </Box>

            {/* Desktop Auth Controls */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
              {token ? (
                <>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: '#FFD9E4',
                        color: '#A31346',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                      }}
                    >
                      {email ? email.charAt(0).toUpperCase() : 'U'}
                    </Avatar>
                    <Typography variant="body2" sx={{ color: '#8A6E76', fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {email}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleLogout}
                    startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      borderColor: '#EFE6E8',
                      color: '#241019',
                      fontSize: '0.85rem',
                      py: 0.6,
                      px: 2,
                      '&:hover': {
                        borderColor: '#E8336D',
                        color: '#A31346',
                        bgcolor: '#FFD9E4',
                      },
                    }}
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => navigate('/login')}
                    sx={{ color: '#A31346', fontWeight: 600 }}
                  >
                    Sign in
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate('/register')}
                    sx={{
                      bgcolor: '#E8336D',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      px: 2.5,
                      '&:hover': { bgcolor: '#A31346' },
                    }}
                  >
                    Get started
                  </Button>
                </Box>
              )}
            </Box>

            {/* Mobile Header Icons & Hamburger Drawer Toggle */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
              {token && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleLogout}
                  sx={{
                    borderColor: '#EFE6E8',
                    color: '#A31346',
                    fontSize: '0.78rem',
                    py: 0.4,
                    px: 1.2,
                    minWidth: 'auto',
                    whiteSpace: 'nowrap',
                    '&:hover': { bgcolor: '#FFD9E4', borderColor: '#E8336D' },
                  }}
                >
                  Log out
                </Button>
              )}
              <IconButton
                onClick={() => setMobileOpen(true)}
                sx={{
                  color: '#241019',
                  p: 1,
                  borderRadius: 2,
                  border: '1px solid #EFE6E8',
                }}
                aria-label="Open mobile navigation menu"
              >
                <MenuIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Slide-out Mobile Navigation Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: {
            width: 290,
            bgcolor: '#FFF9FA',
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          },
        }}
      >
        <Box>
          {/* Mobile Drawer Top Bar */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "'Archivo', sans-serif",
                fontWeight: 800,
                color: '#241019',
              }}
            >
              Hired<Box component="span" sx={{ color: '#E8336D' }}>AI</Box>
            </Typography>
            <IconButton onClick={() => setMobileOpen(false)} sx={{ color: '#8A6E76' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Mobile User Profile Card */}
          {token && (
            <Box
              sx={{
                p: 2,
                mb: 3,
                borderRadius: 3,
                bgcolor: '#FFFFFF',
                border: '1px solid #EFE6E8',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Avatar sx={{ bgcolor: '#FFD9E4', color: '#A31346', width: 36, height: 36, fontWeight: 700 }}>
                {email ? email.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <Box sx={{ overflow: 'hidden' }}>
                <Typography variant="caption" sx={{ color: '#8A6E76', display: 'block', lineHeight: 1.2 }}>
                  Signed in as
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#241019', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {email}
                </Typography>
              </Box>
            </Box>
          )}

          <Divider sx={{ mb: 2, borderColor: '#EFE6E8' }} />

          {/* Mobile Navigation Links */}
          <List disablePadding>
            {NAV_ITEMS.map((item) => {
              const isSelected = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.75 }}>
                  <ListItemButton
                    onClick={() => handleNavClick(item.path)}
                    selected={isSelected}
                    sx={{
                      borderRadius: 2.5,
                      py: 1.2,
                      px: 2,
                      bgcolor: isSelected ? '#FFD9E4' : 'transparent',
                      color: isSelected ? '#A31346' : '#241019',
                      '&:hover': {
                        bgcolor: isSelected ? '#FFD9E4' : '#FFFFFF',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 34, color: isSelected ? '#E8336D' : '#8A6E76' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        item.path === '/saved-jobs' && savedJobs.length > 0 ? (
                          <Box display="flex" alignItems="center" justifyContent="space-between" pr={1}>
                            <span>{item.label}</span>
                            <Chip
                              label={savedJobs.length}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                bgcolor: '#FFD9E4',
                                color: '#A31346',
                              }}
                            />
                          </Box>
                        ) : (
                          item.label
                        )
                      }
                      primaryTypographyProps={{
                        fontFamily: "'Archivo', sans-serif",
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.95rem',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>

        {/* Mobile Drawer Bottom Auth Buttons */}
        <Box pt={2} sx={{ borderTop: '1px solid #EFE6E8' }}>
          {token ? (
            <Button
              fullWidth
              variant="contained"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{
                bgcolor: '#E8336D',
                color: '#FFFFFF',
                fontWeight: 700,
                py: 1.2,
                borderRadius: 2.5,
                '&:hover': { bgcolor: '#A31346' },
              }}
            >
              Log out
            </Button>
          ) : (
            <Box display="flex" flexDirection="column" gap={1.5}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => handleNavClick('/register')}
                startIcon={<PersonAddIcon />}
                sx={{
                  bgcolor: '#E8336D',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  py: 1.2,
                  borderRadius: 2.5,
                  '&:hover': { bgcolor: '#A31346' },
                }}
              >
                Get started
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => handleNavClick('/login')}
                startIcon={<LoginIcon />}
                sx={{
                  borderColor: '#EFE6E8',
                  color: '#A31346',
                  fontWeight: 600,
                  py: 1.2,
                  borderRadius: 2.5,
                  '&:hover': { borderColor: '#E8336D', bgcolor: '#FFD9E4' },
                }}
              >
                Sign in
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>

      <Container maxWidth="lg" sx={{ mt: { xs: 2.5, sm: 4 }, mb: 6, flexGrow: 1, px: { xs: 2, sm: 3 } }}>
        <Outlet />
      </Container>

      <Footer />
    </Box>
  );
}
