import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useAuthStore } from '../store/authStore';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';

import { jobsApi } from '../api/jobs';
import type { JobListingResponse } from '../types/api';

const PAGE_SIZE = 20;

const parseInitialKeywords = (param: string): string[] => {
  if (!param.trim()) return [];
  return param.split(/[,\\s]+/).map((s) => s.trim()).filter(Boolean);
};

export default function JobFeedPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const [searchParams, setSearchParams] = useSearchParams();
  const initialKeywordParam = searchParams.get('keyword') || '';
  const initialLocation = searchParams.get('location') || '';

  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [jobs, setJobs] = useState<JobListingResponse[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);

  // Multi-keyword state
  const [keywords, setKeywords] = useState<string[]>(() => parseInitialKeywords(initialKeywordParam));
  const [keywordInput, setKeywordInput] = useState('');

  const [location, setLocation] = useState(initialLocation);
  const [platform, setPlatform] = useState('');
  const [sort, setSort] = useState('relevance');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Mobile Filter Drawer state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Derived query string for API
  const getCombinedKeywordString = useCallback(() => {
    const all = [...keywords];
    if (keywordInput.trim() && !all.includes(keywordInput.trim())) {
      all.push(keywordInput.trim());
    }
    return all.join(' ');
  }, [keywords, keywordInput]);

  const activeFilterCount = [
    keywords.length > 0 || !!keywordInput.trim(),
    !!location.trim(),
    !!platform,
    sort !== 'relevance',
  ].filter(Boolean).length;

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const searchKeyword = getCombinedKeywordString();
    jobsApi
      .search({
        keyword: searchKeyword || undefined,
        location: location || undefined,
        platform: platform || undefined,
        sort,
        page: 0,
        size: PAGE_SIZE,
      })
      .then((res) => {
        setJobs(res.content);
        setPage(0);
        setTotalElements(res.totalElements);
      })
      .catch(() => setError('Failed to load jobs from feed'))
      .finally(() => setLoading(false));
  }, [getCombinedKeywordString, location, platform, sort]);

  const loadMore = () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    setError(null);
    const searchKeyword = getCombinedKeywordString();
    jobsApi
      .search({
        keyword: searchKeyword || undefined,
        location: location || undefined,
        platform: platform || undefined,
        sort,
        page: nextPage,
        size: PAGE_SIZE,
      })
      .then((res) => {
        setJobs((prev) => [...prev, ...res.content]);
        setPage(nextPage);
        setTotalElements(res.totalElements);
      })
      .catch(() => setError('Failed to load more jobs'))
      .finally(() => setLoadingMore(false));
  };

  useEffect(() => {
    jobsApi.platforms().then(setPlatforms).catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
  }, [platform, sort]);

  // Keyword chip input handlers
  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = keywordInput.trim().replace(/,/g, '');
      if (val) {
        if (!keywords.includes(val)) {
          setKeywords((prev) => [...prev, val]);
        }
        setKeywordInput('');
      } else {
        handleSearchSubmit(e);
      }
    } else if (e.key === 'Backspace' && !keywordInput && keywords.length > 0) {
      setKeywords((prev) => prev.slice(0, -1));
    }
  };

  const handleAddCurrentKeywordInput = () => {
    const val = keywordInput.trim().replace(/,/g, '');
    if (val && !keywords.includes(val)) {
      setKeywords((prev) => [...prev, val]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (indexToRemove: number) => {
    setKeywords((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddCurrentKeywordInput();
    const searchKeyword = getCombinedKeywordString();
    const newParams: Record<string, string> = {};
    if (searchKeyword) newParams.keyword = searchKeyword;
    if (location) newParams.location = location;
    setSearchParams(newParams);
    load();
    if (mobileFilterOpen) setMobileFilterOpen(false);
  };

  const handleResetFilters = () => {
    setKeywords([]);
    setKeywordInput('');
    setLocation('');
    setPlatform('');
    setSort('relevance');
    setSearchParams({});
    if (mobileFilterOpen) setMobileFilterOpen(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    setInfo(null);
    try {
      const { fetched } = await jobsApi.refresh();
      setInfo(`Pulled ${fetched} new listings from connected job sources.`);
      load();
    } catch {
      setError('Failed to refresh listings from job sources');
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleSave = async (job: JobListingResponse) => {
    if (!token) {
      setAuthModalOpen(true);
      return;
    }
    setBusyId(job.id);
    try {
      if (job.saved) {
        await jobsApi.unsave(job.id);
      } else {
        await jobsApi.save(job.id);
      }
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, saved: !j.saved } : j)));
    } catch {
      setError('Failed to update saved status');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleApplied = async (job: JobListingResponse) => {
    if (!token) {
      setAuthModalOpen(true);
      return;
    }
    setBusyId(job.id);
    try {
      await jobsApi.markApplied(job.id, !job.appliedManually);
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, appliedManually: !j.appliedManually } : j)));
    } catch {
      setError('Failed to update applied status');
    } finally {
      setBusyId(null);
    }
  };

  // Reusable multi-keyword Chip Input component
  const renderKeywordChipInput = (placeholderText = 'e.g. Java, React (Press Enter)') => (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'nowrap',
        alignItems: 'center',
        gap: 0.75,
        px: 1.5,
        bgcolor: '#FFF9FA',
        border: '1.5px solid #EFE6E8',
        borderRadius: 2.5,
        height: 40,
        minHeight: 40,
        maxHeight: 40,
        boxSizing: 'border-box',
        overflowX: 'auto',
        '&::-webkit-scrollbar': { display: 'none' },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        outline: 'none !important',
        WebkitTapHighlightColor: 'transparent',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: '#E8336D',
          bgcolor: '#FFFFFF',
        },
        '&:focus-within': {
          borderColor: '#E8336D',
          bgcolor: '#FFFFFF',
          boxShadow: 'none',
        },
      }}
    >
      <SearchIcon sx={{ color: '#8A6E76', fontSize: 18, flexShrink: 0 }} />
      {keywords.map((kw, idx) => (
        <Chip
          key={`${kw}-${idx}`}
          label={kw}
          size="small"
          onDelete={() => handleRemoveKeyword(idx)}
          sx={{
            bgcolor: '#FFD9E4',
            color: '#A31346',
            fontWeight: 600,
            fontSize: '0.75rem',
            height: 24,
            flexShrink: 0,
            outline: 'none !important',
          }}
        />
      ))}
      <Box
        component="input"
        value={keywordInput}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeywordInput(e.target.value)}
        onKeyDown={handleKeywordKeyDown}
        onBlur={handleAddCurrentKeywordInput}
        placeholder={keywords.length === 0 ? placeholderText : 'Add tag...'}
        sx={{
          border: 'none',
          outline: 'none !important',
          bgcolor: 'transparent',
          color: '#241019',
          fontFamily: 'inherit',
          fontSize: '0.875rem',
          flex: '1 0 100px',
          minWidth: 80,
          py: 0,
          height: '100%',
          boxShadow: 'none !important',
          '&:focus': { outline: 'none !important' },
        }}
      />
    </Box>
  );

  return (
    <Box sx={{ pb: 6, WebkitTapHighlightColor: 'transparent' }}>
      {/* Top Header & Refresh Bar */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5, color: '#241019' }}>
            Job Feed
          </Typography>
          <Typography variant="body2" sx={{ color: '#8A6E76' }}>
            Aggregated remote roles from all enabled boards
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleRefresh}
          disabled={refreshing}
          startIcon={<RefreshIcon />}
          sx={{
            bgcolor: '#E8336D',
            color: '#FFFFFF',
            fontWeight: 700,
            outline: 'none !important',
            boxShadow: 'none !important',
            '&:hover': { bgcolor: '#A31346' },
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          {refreshing ? 'Refreshing sources…' : 'Refresh from sources'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Snackbar
        open={!!info}
        autoHideDuration={4500}
        onClose={() => setInfo(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setInfo(null)} sx={{ width: '100%', bgcolor: '#FFD9E4', color: '#A31346', fontWeight: 600 }}>
          {info}
        </Alert>
      </Snackbar>

      {/* MOBILE COMPACT FILTER BAR (< md screens) */}
      {isMobile ? (
        <Box sx={{ mb: 3 }}>
          <Paper
            elevation={0}
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{
              p: 1.5,
              bgcolor: '#FFFFFF',
              border: '1px solid #EFE6E8',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              outline: 'none !important',
              boxShadow: 'none !important',
            }}
          >
            <Box flex={1}>
              {renderKeywordChipInput('Search java, backend...')}
            </Box>
            <Button
              variant="contained"
              type="submit"
              sx={{
                height: 40,
                minWidth: 40,
                px: 2,
                bgcolor: '#E8336D',
                color: '#FFFFFF',
                borderRadius: 2,
                flexShrink: 0,
                outline: 'none !important',
                boxShadow: 'none !important',
                '&:hover': { bgcolor: '#A31346' },
              }}
            >
              Search
            </Button>
            <IconButton
              onClick={() => setMobileFilterOpen(true)}
              sx={{
                height: 40,
                width: 40,
                borderRadius: 2,
                bgcolor: activeFilterCount > 0 ? '#FFD9E4' : '#FFF9FA',
                border: '1px solid',
                borderColor: activeFilterCount > 0 ? '#E8336D' : '#EFE6E8',
                color: activeFilterCount > 0 ? '#A31346' : '#241019',
                flexShrink: 0,
                outline: 'none !important',
              }}
            >
              <Badge badgeContent={activeFilterCount} color="primary" sx={{ '& .MuiBadge-badge': { bgcolor: '#E8336D' } }}>
                <TuneIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Paper>

          {/* Active Filters Scrollable Chips Row on Mobile */}
          {activeFilterCount > 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, overflowX: 'auto', pb: 0.5, alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#8A6E76', fontWeight: 600, flexShrink: 0 }}>
                Active:
              </Typography>
              {keywords.map((kw, idx) => (
                <Chip
                  key={`active-kw-${kw}-${idx}`}
                  label={`"${kw}"`}
                  size="small"
                  onDelete={() => handleRemoveKeyword(idx)}
                  sx={{ bgcolor: '#FFD9E4', color: '#A31346', fontWeight: 600, flexShrink: 0, outline: 'none !important' }}
                />
              ))}
              {location && (
                <Chip
                  label={location}
                  size="small"
                  onDelete={() => { setLocation(''); }}
                  sx={{ bgcolor: '#FFD9E4', color: '#A31346', fontWeight: 600, flexShrink: 0, outline: 'none !important' }}
                />
              )}
              {platform && (
                <Chip
                  label={platform}
                  size="small"
                  onDelete={() => setPlatform('')}
                  sx={{ bgcolor: '#FFD9E4', color: '#A31346', fontWeight: 600, flexShrink: 0, outline: 'none !important' }}
                />
              )}
              {sort !== 'relevance' && (
                <Chip
                  label={`Sort: ${sort}`}
                  size="small"
                  onDelete={() => setSort('relevance')}
                  sx={{ bgcolor: '#FFD9E4', color: '#A31346', fontWeight: 600, flexShrink: 0, outline: 'none !important' }}
                />
              )}
              <Button
                size="small"
                onClick={handleResetFilters}
                sx={{ color: '#8A6E76', fontSize: '0.75rem', p: 0, minWidth: 'auto', flexShrink: 0, outline: 'none !important' }}
              >
                Clear all
              </Button>
            </Stack>
          )}

          {/* MOBILE SLIDE-UP FILTER DRAWER / BOTTOM SHEET */}
          <Drawer
            anchor="bottom"
            open={mobileFilterOpen}
            onClose={() => setMobileFilterOpen(false)}
            PaperProps={{
              sx: {
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                p: 3,
                maxHeight: '85vh',
                bgcolor: '#FFFFFF',
                outline: 'none !important',
              },
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <FilterListIcon sx={{ color: '#A31346' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#241019' }}>
                  Filter Jobs
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                {activeFilterCount > 0 && (
                  <Button size="small" onClick={handleResetFilters} sx={{ color: '#A31346', fontWeight: 600, outline: 'none !important' }}>
                    Reset all
                  </Button>
                )}
                <IconButton onClick={() => setMobileFilterOpen(false)} size="small" sx={{ outline: 'none !important' }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            <Box component="form" onSubmit={handleSearchSubmit} display="flex" flexDirection="column" gap={2.5}>
              <Box>
                <Typography variant="caption" sx={{ color: '#8A6E76', fontWeight: 600, mb: 0.75, display: 'block' }}>
                  Keywords (Press Enter after each keyword)
                </Typography>
                {renderKeywordChipInput('e.g. Java, Backend')}
              </Box>

              <TextField
                fullWidth
                label="Location"
                placeholder="e.g. Remote, Europe"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon sx={{ color: '#8A6E76', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  outline: 'none !important',
                  '& .MuiOutlinedInput-root': {
                    outline: 'none !important',
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E8336D',
                      borderWidth: '1.5px',
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                select
                label="Source platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                size="small"
                sx={{
                  outline: 'none !important',
                  '& .MuiOutlinedInput-root': {
                    outline: 'none !important',
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E8336D',
                      borderWidth: '1.5px',
                    },
                  },
                }}
              >
                <MenuItem value="">All connected sources</MenuItem>
                {platforms.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                select
                label="Sort order"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                size="small"
                sx={{
                  outline: 'none !important',
                  '& .MuiOutlinedInput-root': {
                    outline: 'none !important',
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E8336D',
                      borderWidth: '1.5px',
                    },
                  },
                }}
              >
                <MenuItem value="relevance">Match Score (Highest first)</MenuItem>
                <MenuItem value="date">Date posted</MenuItem>
                <MenuItem value="salary">Salary</MenuItem>
              </TextField>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                sx={{
                  mt: 1,
                  height: 48,
                  bgcolor: '#E8336D',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '1rem',
                  borderRadius: 2.5,
                  outline: 'none !important',
                  boxShadow: 'none !important',
                  '&:hover': { bgcolor: '#A31346' },
                }}
              >
                Apply Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </Button>
            </Box>
          </Drawer>
        </Box>
      ) : (
        /* DESKTOP FULL FILTERS BAR (>= md screens) */
        <Paper
          elevation={0}
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            p: { xs: 2.5, md: 3 },
            px: { xs: 2.5, md: 3.5 },
            mb: 4,
            bgcolor: '#FFFFFF',
            border: '1px solid #EFE6E8',
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(36, 16, 25, 0.03)',
            outline: 'none !important',
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5}>
            <Box display="flex" alignItems="center" gap={1}>
              <FilterListIcon sx={{ color: '#A31346', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ color: '#241019', fontWeight: 700, fontSize: '0.95rem' }}>
                Filter listings
              </Typography>
            </Box>
            {activeFilterCount > 0 && (
              <Button
                size="small"
                onClick={handleResetFilters}
                sx={{ color: '#8A6E76', fontSize: '0.8rem', fontWeight: 600, outline: 'none !important' }}
              >
                Clear all filters
              </Button>
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
              alignItems: { xs: 'stretch', md: 'center' },
              width: '100%',
            }}
          >
            <Box sx={{ flex: 1.4, minWidth: 0 }}>
              {renderKeywordChipInput('Type keyword & press Enter')}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <TextField
                fullWidth
                label="Location"
                placeholder="e.g. Remote, Europe"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon sx={{ color: '#8A6E76', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  outline: 'none !important',
                  WebkitTapHighlightColor: 'transparent',
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#FFF9FA',
                    borderRadius: 2.5,
                    outline: 'none !important',
                    boxShadow: 'none !important',
                    transition: 'all 0.2s ease',
                    '& fieldset': { borderColor: '#EFE6E8', borderWidth: '1.5px', borderRadius: 2.5 },
                    '&:hover fieldset': { borderColor: '#E8336D' },
                    '&.Mui-focused': {
                      bgcolor: '#FFFFFF',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#E8336D',
                      borderWidth: '1.5px',
                      borderRadius: 2.5,
                    },
                  },
                }}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <TextField
                fullWidth
                select
                label="Source platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                size="small"
                sx={{
                  outline: 'none !important',
                  WebkitTapHighlightColor: 'transparent',
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#FFF9FA',
                    borderRadius: 2.5,
                    outline: 'none !important',
                    boxShadow: 'none !important',
                    transition: 'all 0.2s ease',
                    '& fieldset': { borderColor: '#EFE6E8', borderWidth: '1.5px', borderRadius: 2.5 },
                    '&:hover fieldset': { borderColor: '#E8336D' },
                    '&.Mui-focused': {
                      bgcolor: '#FFFFFF',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#E8336D',
                      borderWidth: '1.5px',
                      borderRadius: 2.5,
                    },
                  },
                }}
              >
                <MenuItem value="">All connected sources</MenuItem>
                {platforms.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <TextField
                fullWidth
                select
                label="Sort order"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                size="small"
                sx={{
                  outline: 'none !important',
                  WebkitTapHighlightColor: 'transparent',
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#FFF9FA',
                    borderRadius: 2.5,
                    outline: 'none !important',
                    boxShadow: 'none !important',
                    transition: 'all 0.2s ease',
                    '& fieldset': { borderColor: '#EFE6E8', borderWidth: '1.5px', borderRadius: 2.5 },
                    '&:hover fieldset': { borderColor: '#E8336D' },
                    '&.Mui-focused': {
                      bgcolor: '#FFFFFF',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#E8336D',
                      borderWidth: '1.5px',
                      borderRadius: 2.5,
                    },
                  },
                }}
              >
                <MenuItem value="relevance">Match Score (Highest first)</MenuItem>
                <MenuItem value="date">Date posted</MenuItem>
                <MenuItem value="salary">Salary</MenuItem>
              </TextField>
            </Box>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                height: 40,
                px: 3.5,
                whiteSpace: 'nowrap',
                bgcolor: '#E8336D',
                color: '#FFFFFF',
                fontWeight: 700,
                borderRadius: 2.5,
                flexShrink: 0,
                width: { xs: '100%', md: 'auto' },
                outline: 'none !important',
                boxShadow: 'none !important',
                '&:hover': {
                  bgcolor: '#A31346',
                },
              }}
            >
              Apply
            </Button>
          </Box>
        </Paper>
      )}

      {loading && <LinearProgress sx={{ mb: 3, bgcolor: '#FFD9E4', '& .MuiLinearProgress-bar': { bgcolor: '#E8336D' } }} />}

      {/* Feed Cards Grid */}
      <Grid container spacing={2.5}>
        {jobs.map((job) => (
          <Grid item xs={12} md={6} key={job.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                bgcolor: '#FFFFFF',
                border: '1px solid #EFE6E8',
                outline: 'none !important',
                boxShadow: 'none !important',
                '&:hover': {
                  borderColor: '#D8C3C9',
                  boxShadow: '0 6px 20px rgba(36, 16, 25, 0.05) !important',
                },
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 3 }, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <Box sx={{ flexGrow: 1 }}>
                  {/* Header info */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5} gap={1}>
                    <Box>
                      <Typography variant="h6" sx={{ fontSize: { xs: '1.05rem', sm: '1.15rem' }, color: '#241019', mb: 0.5, lineHeight: 1.3 }}>
                        {job.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#8A6E76', fontWeight: 500 }}>
                        {job.company} — <Box component="span" sx={{ color: '#241019' }}>{job.location}</Box>
                      </Typography>
                    </Box>

                    {/* Match Score Badge */}
                    {typeof job.matchScore === 'number' && (
                      <Tooltip title="AI Match Score based on your uploaded resume">
                        <Chip
                          label={`${job.matchScore}% match`}
                          size="small"
                          sx={{
                            bgcolor: '#FFD9E4',
                            color: '#A31346',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            height: 26,
                            flexShrink: 0,
                            outline: 'none !important',
                          }}
                        />
                      </Tooltip>
                    )}
                  </Box>

                  {/* Platform & Salary Tags */}
                  <Box display="flex" gap={1} flexWrap="wrap" mt={2} mb={2}>
                    <Chip
                      label={job.platform}
                      size="small"
                      sx={{
                        bgcolor: '#FFF9FA',
                        color: '#8A6E76',
                        border: '1px solid #EFE6E8',
                        fontSize: '0.75rem',
                        outline: 'none !important',
                      }}
                    />
                    {job.salaryRange && (
                      <Chip
                        label={job.salaryRange}
                        size="small"
                        sx={{
                          bgcolor: '#FFF9FA',
                          color: '#241019',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          outline: 'none !important',
                        }}
                      />
                    )}
                    {job.appliedManually && (
                      <Chip
                        label="Applied"
                        size="small"
                        sx={{
                          bgcolor: '#FFF9FA',
                          color: '#241019',
                          border: '1px solid #D8C3C9',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          outline: 'none !important',
                        }}
                      />
                    )}
                  </Box>
                </Box>

                {/* Match Score Bar */}
                {typeof job.matchScore === 'number' ? (
                  <Box sx={{ mt: 'auto', pt: 1.5 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(job.matchScore, 100)}
                      sx={{
                        height: 5,
                        borderRadius: 3,
                        bgcolor: '#EFE6E8',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: job.matchScore >= 80 ? '#E8336D' : '#8A6E76',
                          borderRadius: 3,
                        },
                      }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ mt: 'auto', height: 5 }} />
                )}
              </CardContent>

              {/* Card Actions */}
              <CardActions sx={{ px: { xs: 2.5, sm: 3 }, pb: { xs: 2.5, sm: 3 }, pt: 0, display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  variant="contained"
                  endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    bgcolor: '#E8336D',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    px: 2.5,
                    py: 0.75,
                    flexGrow: 1,
                    outline: 'none !important',
                    boxShadow: 'none !important',
                    '&:hover': { bgcolor: '#A31346' },
                  }}
                >
                  View & Apply
                </Button>

                <Tooltip title={job.saved ? 'Remove from saved' : 'Save job'}>
                  <IconButton
                    disabled={busyId === job.id}
                    onClick={() => handleToggleSave(job)}
                    sx={{
                      border: '1px solid #EFE6E8',
                      borderRadius: 2,
                      color: job.saved ? '#E8336D' : '#8A6E76',
                      bgcolor: job.saved ? '#FFD9E4' : 'transparent',
                      outline: 'none !important',
                      '&:hover': {
                        borderColor: '#E8336D',
                        bgcolor: '#FFD9E4',
                        color: '#A31346',
                      },
                    }}
                  >
                    {job.saved ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>

                <Tooltip title={job.appliedManually ? 'Mark as not applied' : 'Mark as applied'}>
                  <IconButton
                    disabled={busyId === job.id}
                    onClick={() => handleToggleApplied(job)}
                    sx={{
                      border: '1px solid #EFE6E8',
                      borderRadius: 2,
                      color: job.appliedManually ? '#A31346' : '#8A6E76',
                      bgcolor: job.appliedManually ? '#FFD9E4' : 'transparent',
                      outline: 'none !important',
                      '&:hover': {
                        borderColor: '#A31346',
                        bgcolor: '#FFD9E4',
                      },
                    }}
                  >
                    {job.appliedManually ? <CheckCircleIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {jobs.length === 0 && !loading && (
          <Grid item xs={12}>
            <Paper sx={{ p: { xs: 4, sm: 6 }, textAlign: 'center', bgcolor: '#FFFFFF', borderRadius: 3, outline: 'none !important' }}>
              <Typography variant="h6" sx={{ color: '#241019', mb: 1 }}>
                No job listings found
              </Typography>
              <Typography variant="body2" sx={{ color: '#8A6E76', mb: 3 }}>
                Try adjusting your search keywords or click “Refresh from sources” to pull fresh listings.
              </Typography>
              <Button
                variant="contained"
                onClick={handleRefresh}
                sx={{ bgcolor: '#E8336D', outline: 'none !important', boxShadow: 'none !important', '&:hover': { bgcolor: '#A31346' } }}
              >
                Refresh from sources
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Pagination Bar */}
      {jobs.length > 0 && (
        <Box display="flex" flexDirection="column" alignItems="center" gap={1.5} mt={5}>
          <Typography variant="body2" sx={{ color: '#8A6E76' }}>
            Showing {jobs.length} of {totalElements} listings
          </Typography>
          {jobs.length < totalElements && (
            <Button
              variant="outlined"
              onClick={loadMore}
              disabled={loadingMore}
              sx={{
                px: 4,
                py: 1,
                borderColor: '#E8336D',
                color: '#A31346',
                fontWeight: 600,
                outline: 'none !important',
                boxShadow: 'none !important',
                '&:hover': {
                  borderColor: '#A31346',
                  bgcolor: '#FFD9E4',
                },
              }}
            >
              {loadingMore ? 'Loading more listings…' : 'Load more listings'}
            </Button>
          )}
        </Box>
      )}

      {/* Auth Prompt Dialog for Unauthenticated Users */}
      <Dialog
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        PaperProps={{
          sx: { borderRadius: 4, p: 1, maxWidth: 420 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#241019', fontFamily: "'Archivo', sans-serif" }}>
          Sign in required
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#8A6E76', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Saving jobs and tracking application status requires a free HiredAI account. Sign in or create an account to organize your job search.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setAuthModalOpen(false)} sx={{ color: '#8A6E76', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            onClick={() => { setAuthModalOpen(false); navigate('/login'); }}
            sx={{ borderColor: '#E8336D', color: '#A31346', fontWeight: 600 }}
          >
            Sign in
          </Button>
          <Button
            variant="contained"
            onClick={() => { setAuthModalOpen(false); navigate('/register'); }}
            sx={{ bgcolor: '#E8336D', color: '#FFFFFF', fontWeight: 700 }}
          >
            Get started
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
