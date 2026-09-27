import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BoltIcon from '@mui/icons-material/Bolt';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const SAMPLE_FEATURED_JOBS = [
  {
    id: 'sample-1',
    title: 'Senior Full Stack Engineer',
    company: 'Stripe',
    location: 'Remote (Global)',
    salary: '$150,000 - $190,000',
    platform: 'WeWorkRemotely',
    tags: ['React', 'TypeScript', 'Node.js'],
    posted: '2 hours ago',
  },
  {
    id: 'sample-2',
    title: 'Lead Product Designer',
    company: 'Linear',
    location: 'Remote (US/EU)',
    salary: '$140,000 - $175,000',
    platform: 'RemoteOK',
    tags: ['Figma', 'Design Systems'],
    posted: '5 hours ago',
  },
  {
    id: 'sample-3',
    title: 'Staff Backend Engineer (Distributed Systems)',
    company: 'Supabase',
    location: 'Remote (Anywhere)',
    salary: '$160,000 - $210,000',
    platform: 'Arbeitnow',
    tags: ['Go', 'PostgreSQL', 'Kubernetes'],
    posted: '1 day ago',
  },
];

const SOURCE_PLATFORMS = [
  'Google Jobs',
  'WeWorkRemotely',
  'RemoteOK',
  'Himalayas',
  'Jobicy',
  'Remotive',
  'Arbeitnow',
];

export default function HomePage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (location.trim()) params.set('location', location.trim());
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <Box sx={{ pb: 8 }}>
      {/* Hero Section */}
      <Box sx={{ pt: { xs: 4, md: 8 }, pb: { xs: 6, md: 10 } }}>
        <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
          {/* Left-aligned Hero Content */}
          <Grid item xs={12} md={7}>
            <Box sx={{ maxWidth: 640 }}>
              {/* Confident Accent Badge */}
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.75,
                  py: 0.6,
                  borderRadius: 20,
                  bgcolor: '#FFD9E4', // --color-accent-soft
                  color: '#A31346',   // --color-accent-deep
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  mb: 2.5,
                }}
              >
                <BoltIcon sx={{ fontSize: 18, color: '#E8336D' }} />
                <span>Aggregating top remote opportunities</span>
              </Box>

              {/* Main Headline */}
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '1.85rem', sm: '3.0rem', md: '3.8rem' },
                  lineHeight: 1.15,
                  letterSpacing: '-0.025em',
                  mb: 2.5,
                  color: '#241019',
                }}
              >
                One stop solution for your remote job hunting
              </Typography>

              {/* Subhead */}
              <Typography
                variant="subtitle1"
                sx={{
                  fontSize: { xs: '1.05rem', md: '1.2rem' },
                  lineHeight: 1.6,
                  color: '#8A6E76', // --color-muted
                  mb: 4,
                }}
              >
                We pull listings from 5+ job boards into one feed — search once, apply wherever you find the fit.
              </Typography>

              {/* Hero Search Bar */}
              <Paper
                component="form"
                onSubmit={handleSearch}
                elevation={0}
                sx={{
                  p: { xs: 1.5, sm: 1.75 },
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'stretch',
                  gap: 1.5,
                  borderRadius: { xs: 4, sm: 50 },
                  border: '1px solid #EFE6E8',
                  boxShadow: '0 8px 30px rgba(36, 16, 25, 0.06)',
                  bgcolor: '#FFFFFF',
                  mb: 3,
                }}
              >
                <TextField
                  placeholder="Title, skill, or keyword"
                  variant="outlined"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#8A6E76', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    flex: { sm: 1 },
                    outline: 'none !important',
                    WebkitTapHighlightColor: 'transparent',
                    '& .MuiOutlinedInput-root': {
                      height: 48,
                      bgcolor: '#FFF9FA',
                      borderRadius: { xs: 3, sm: 50 },
                      fontSize: '0.95rem',
                      outline: 'none !important',
                      boxShadow: 'none !important',
                      transition: 'all 0.2s ease',
                      '& fieldset': { borderColor: '#EFE6E8', borderWidth: '1.5px', borderRadius: { xs: 3, sm: 50 } },
                      '&:hover fieldset': { borderColor: '#E8336D' },
                      '&.Mui-focused': {
                        bgcolor: '#FFFFFF',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#E8336D',
                        borderWidth: '1.5px',
                        borderRadius: { xs: 3, sm: 50 },
                        boxShadow: 'none',
                      },
                    },
                  }}
                />
                <TextField
                  placeholder="Location or 'Remote'"
                  variant="outlined"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOnIcon sx={{ color: '#8A6E76', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    flex: { sm: 1 },
                    outline: 'none !important',
                    WebkitTapHighlightColor: 'transparent',
                    '& .MuiOutlinedInput-root': {
                      height: 48,
                      bgcolor: '#FFF9FA',
                      borderRadius: { xs: 3, sm: 50 },
                      fontSize: '0.95rem',
                      outline: 'none !important',
                      boxShadow: 'none !important',
                      transition: 'all 0.2s ease',
                      '& fieldset': { borderColor: '#EFE6E8', borderWidth: '1.5px', borderRadius: { xs: 3, sm: 50 } },
                      '&:hover fieldset': { borderColor: '#E8336D' },
                      '&.Mui-focused': {
                        bgcolor: '#FFFFFF',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#E8336D',
                        borderWidth: '1.5px',
                        borderRadius: { xs: 3, sm: 50 },
                        boxShadow: 'none',
                      },
                    },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    height: 48,
                    px: 4,
                    whiteSpace: 'nowrap',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    borderRadius: { xs: 3, sm: 50 },
                    bgcolor: '#E8336D', // --color-accent
                    color: '#FFFFFF',
                    flexShrink: 0,
                    width: { xs: '100%', sm: 'auto' },
                    boxShadow: '0 4px 14px rgba(232, 51, 109, 0.25)',
                    outline: 'none !important',
                    WebkitTapHighlightColor: 'transparent',
                    '&:hover': {
                      bgcolor: '#A31346', // --color-accent-deep
                      boxShadow: '0 6px 18px rgba(163, 19, 70, 0.3)',
                    },
                  }}
                  endIcon={<ArrowForwardIcon />}
                >
                  Search
                </Button>
              </Paper>

              <Typography variant="caption" sx={{ color: '#8A6E76', display: 'block' }}>
                Popular queries: Senior React, Go Developer, Full Stack, Product Manager
              </Typography>
            </Box>
          </Grid>

          {/* Right Side Visual — Stacked Job Card Previews with One Deliberate Load Motion */}
          <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box
              className="hero-card-stack"
              sx={{
                position: 'relative',
                minHeight: { xs: 320, sm: 360, md: 400 },
                width: '100%',
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                perspective: '1000px',
                py: 2,
              }}
            >
              {/* Back Card 2 (Bottom - offset right + rotate) */}
              <Paper
                elevation={0}
                sx={{
                  position: 'absolute',
                  width: '90%',
                  top: '12%',
                  right: '0%',
                  transform: 'rotate(4deg)',
                  p: 2.5,
                  borderRadius: 3.5,
                  border: '1px solid #EFE6E8',
                  bgcolor: '#FFFFFF',
                  opacity: 0.75,
                  zIndex: 1,
                  boxShadow: '0 4px 20px rgba(36, 16, 25, 0.04)',
                }}
              >
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle2" color="#241019">
                    Backend Engineer (Go)
                  </Typography>
                  <Chip label="Remotive" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                </Box>
                <Typography variant="body2" color="#8A6E76" fontSize="0.85rem">
                  Supabase • $140k - $180k
                </Typography>
              </Paper>

              {/* Back Card 1 (Middle - offset left - rotate) */}
              <Paper
                elevation={0}
                sx={{
                  position: 'absolute',
                  width: '92%',
                  top: '6%',
                  left: '2%',
                  transform: 'rotate(-3deg)',
                  p: 2.5,
                  borderRadius: 3.5,
                  border: '1px solid #EFE6E8',
                  bgcolor: '#FFFFFF',
                  opacity: 0.9,
                  zIndex: 2,
                  boxShadow: '0 6px 24px rgba(36, 16, 25, 0.06)',
                }}
              >
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle2" color="#241019">
                    Lead Product Designer
                  </Typography>
                  <Chip label="RemoteOK" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                </Box>
                <Typography variant="body2" color="#8A6E76" fontSize="0.85rem">
                  Linear • Remote (US/EU)
                </Typography>
              </Paper>

              {/* Top Featured Card (Bold Accent Border + Tag) */}
              <Paper
                elevation={0}
                sx={{
                  position: 'relative',
                  width: '96%',
                  p: 3,
                  borderRadius: 4,
                  border: '2px solid #E8336D', // Confident accent border on primary hero card
                  bgcolor: '#FFFFFF',
                  zIndex: 3,
                  boxShadow: '0 12px 36px rgba(232, 51, 109, 0.12), 0 4px 12px rgba(36, 16, 25, 0.04)',
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Typography variant="h6" sx={{ fontSize: '1.15rem', fontWeight: 700, color: '#241019' }}>
                        Staff Frontend Engineer
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#8A6E76', fontWeight: 500 }}>
                      Vercel • Remote (Worldwide)
                    </Typography>
                  </Box>
                  <Chip
                    label="98% Match"
                    size="small"
                    sx={{
                      bgcolor: '#FFD9E4',
                      color: '#A31346',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      height: 24,
                    }}
                  />
                </Box>

                <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                  <Chip label="React 19" size="small" variant="outlined" sx={{ borderColor: '#EFE6E8', fontSize: '0.75rem' }} />
                  <Chip label="Next.js" size="small" variant="outlined" sx={{ borderColor: '#EFE6E8', fontSize: '0.75rem' }} />
                  <Chip label="$160k - $195k" size="small" variant="outlined" sx={{ borderColor: '#EFE6E8', fontSize: '0.75rem' }} />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" pt={1.5} sx={{ borderTop: '1px solid #EFE6E8' }}>
                  <Typography variant="caption" sx={{ color: '#8A6E76', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <WorkOutlineIcon sx={{ fontSize: 14 }} /> Via WeWorkRemotely
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => navigate('/jobs')}
                    sx={{
                      bgcolor: '#E8336D',
                      color: '#FFFFFF',
                      py: 0.5,
                      px: 2,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      '&:hover': { bgcolor: '#A31346' },
                    }}
                  >
                    View & Apply
                  </Button>
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Stats & Trust Markers Row Below the Fold */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mb: 8,
          borderRadius: 3.5,
          bgcolor: '#FFFFFF',
          border: '1px solid #EFE6E8',
        }}
      >
        <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
          <Grid item xs={12} lg={4}>
            <Typography
              variant="subtitle2"
              sx={{
                color: '#A31346',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '0.75rem',
                mb: 0.5,
              }}
            >
              Aggregated Job Pipeline
            </Typography>
            <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, color: '#241019', fontWeight: 700, mb: 0.75 }}>
              Pulling real-time remote jobs from major boards
            </Typography>
            <Typography variant="caption" sx={{ color: '#8A6E76', display: 'block' }}>
              Click any source platform below to explore filtered listings
            </Typography>
          </Grid>
          <Grid item xs={12} lg={8}>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: { xs: 1, sm: 1.25 },
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {SOURCE_PLATFORMS.map((platform) => (
                <Box
                  key={platform}
                  onClick={() => navigate(`/jobs?platform=${encodeURIComponent(platform)}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/jobs?platform=${encodeURIComponent(platform)}`);
                    }
                  }}
                  sx={{
                    py: { xs: 0.85, sm: 1.1 },
                    px: { xs: 1.5, sm: 2 },
                    borderRadius: 3,
                    bgcolor: '#FFF9FA',
                    border: '1px solid #EFE6E8',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.75,
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#E8336D',
                      bgcolor: '#FFFFFF',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(232, 51, 109, 0.12)',
                      '& .platform-arrow': {
                        transform: 'translateX(3px)',
                        color: '#A31346',
                      },
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ fontWeight: 700, color: '#241019', fontSize: { xs: '0.8rem', sm: '0.85rem' } }}
                  >
                    {platform}
                  </Typography>
                  <ArrowForwardIcon
                    className="platform-arrow"
                    sx={{
                      fontSize: 14,
                      color: '#E8336D',
                      transition: 'transform 0.2s ease, color 0.2s ease',
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Featured Live Preview Listings */}
      <Box mb={6}>
        <Box
          display="flex"
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
          gap={2}
          mb={3}
        >
          <Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
              Featured Remote Listings
            </Typography>
            <Typography variant="body2" sx={{ color: '#8A6E76' }}>
              Sample of current open roles aggregated across connected sources
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => navigate('/jobs')}
            sx={{
              borderColor: '#E8336D',
              color: '#A31346',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#A31346',
                bgcolor: '#FFD9E4',
              },
            }}
          >
            Explore all feed jobs
          </Button>
        </Box>

        <Grid container spacing={3}>
          {SAMPLE_FEATURED_JOBS.map((job) => (
            <Grid item xs={12} md={4} key={job.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  '&:hover': {
                    borderColor: '#D8C3C9',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Chip
                      label={job.platform}
                      size="small"
                      sx={{
                        bgcolor: '#FFF9FA',
                        color: '#8A6E76',
                        border: '1px solid #EFE6E8',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#8A6E76', fontSize: '0.75rem', fontWeight: 500 }}>
                      {job.posted}
                    </Typography>
                  </Box>

                  <Typography variant="h6" sx={{ fontSize: '1.1rem', mb: 0.5, color: '#241019' }}>
                    {job.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8A6E76', mb: 2 }}>
                    {job.company} — {job.location}
                  </Typography>

                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#241019', mb: 2 }}>
                    {job.salary}
                  </Typography>

                  <Box display="flex" gap={0.75} flexWrap="wrap">
                    {job.tags.map((t) => (
                      <Chip
                        key={t}
                        label={t}
                        size="small"
                        sx={{ bgcolor: '#FFF9FA', color: '#241019', fontSize: '0.75rem' }}
                      />
                    ))}
                  </Box>
                </CardContent>

                <Box sx={{ p: 3, pt: 0, display: 'flex', gap: 1 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => navigate('/jobs')}
                    sx={{
                      bgcolor: '#E8336D',
                      color: '#FFFFFF',
                      '&:hover': { bgcolor: '#A31346' },
                    }}
                  >
                    View & Apply
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/jobs')}
                    sx={{
                      minWidth: 44,
                      px: 1,
                      borderColor: '#EFE6E8',
                      color: '#8A6E76',
                      '&:hover': { borderColor: '#E8336D', color: '#A31346' },
                    }}
                    aria-label="Save job"
                  >
                    <BookmarkBorderIcon fontSize="small" />
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
