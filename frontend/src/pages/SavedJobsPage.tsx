import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Paper,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';
import BookmarkRemoveIcon from '@mui/icons-material/BookmarkRemove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import WorkIcon from '@mui/icons-material/Work';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { useAuthStore } from '../store/authStore';
import { useJobStore } from '../store/jobStore';
import { savedJobsApi } from '../api/savedJobs';
import type { SavedJobResponse } from '../types/api';

export default function SavedJobsPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);

  const {
    savedJobs,
    savedJobsLoadedAt,
    setSavedJobs,
    toggleJobApplied: storeToggleApplied,
    toggleJobSaved: storeToggleSaved,
  } = useJobStore();

  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'saved' | 'applied' | 'all'>('saved');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Background revalidation or initial load
  const load = () => {
    if (!token) return;
    savedJobsApi
      .list()
      .then((data) => {
        setSavedJobs(data);
      })
      .catch((err) => {
        console.error('[SavedJobs] list failed:', err);
        if (savedJobs.length === 0) {
          setError('Failed to load saved jobs');
        }
      });
  };

  useEffect(() => {
    // If not cached or older than 2 minutes, fetch in background
    if (token && (savedJobs.length === 0 || Date.now() - savedJobsLoadedAt > 2 * 60 * 1000)) {
      load();
    }
  }, [token]);

  const handleUnsave = async (job: SavedJobResponse) => {
    setBusyId(job.id);
    storeToggleSaved(job.jobListingId, false);
    try {
      await savedJobsApi.unsave(job.jobListingId);
      const freshList = await savedJobsApi.list();
      setSavedJobs(freshList);
      setToastMessage('Removed job from tracked list.');
    } catch (err: any) {
      storeToggleSaved(job.jobListingId, true);
      console.error('[SavedJobs] unsave failed:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to remove saved job';
      setError(msg);
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleApplied = async (job: SavedJobResponse) => {
    setBusyId(job.id);
    const nextApplied = !job.appliedManually;
    storeToggleApplied(job.jobListingId, nextApplied);

    // Calculate updated counts for UI feedback
    const newSavedOnlyCount = savedJobs.filter((j) =>
      j.id === job.id || j.jobListingId === job.jobListingId ? !nextApplied : !j.appliedManually
    ).length;
    const newAppliedCount = savedJobs.filter((j) =>
      j.id === job.id || j.jobListingId === job.jobListingId ? nextApplied : j.appliedManually
    ).length;

    // Smoothly transition between tabs so user immediately sees the job in its new home
    if (nextApplied && filterTab === 'saved') {
      setFilterTab('applied');
      setToastMessage(`Marked as applied! Moved to Applied list (Saved: ${newSavedOnlyCount} • Applied: ${newAppliedCount})`);
    } else if (!nextApplied && filterTab === 'applied') {
      setFilterTab('saved');
      setToastMessage(`Marked as to apply! Moved to Saved list (Saved: ${newSavedOnlyCount} • Applied: ${newAppliedCount})`);
    } else {
      setToastMessage(nextApplied ? 'Marked as applied!' : 'Marked as not applied.');
    }

    try {
      await savedJobsApi.markApplied(job.jobListingId, nextApplied);
      const freshList = await savedJobsApi.list();
      setSavedJobs(freshList);
    } catch (err: any) {
      storeToggleApplied(job.jobListingId, !nextApplied);
      console.error('[SavedJobs] markApplied failed:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to update applied status';
      setError(msg);
    } finally {
      setBusyId(null);
    }
  };

  const totalCount = savedJobs.length;
  const appliedCount = savedJobs.filter((j) => j.appliedManually).length;
  const savedOnlyCount = savedJobs.filter((j) => !j.appliedManually).length;

  const displayedJobs = savedJobs.filter((job) => {
    if (filterTab === 'applied') return job.appliedManually;
    if (filterTab === 'saved') return !job.appliedManually;
    return true;
  });

  return (
    <Box>
      {/* Page Header */}
      <Box display="flex" alignItems="center" gap={1.5} mb={1}>
        <BookmarkIcon sx={{ color: '#E8336D', fontSize: 28 }} />
        <Typography variant="h4" sx={{ color: '#241019', fontWeight: 800 }}>
          Saved Jobs & Applications
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: '#8A6E76', mb: 3 }}>
        Track jobs you plan to apply for and manage submitted applications in one place.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={!!toastMessage}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {!token ? (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            textAlign: 'center',
            bgcolor: '#FFFFFF',
            border: '1px solid #EFE6E8',
            borderRadius: 4,
            maxWidth: 560,
            mx: 'auto',
            mt: 2,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: '#FFF0F4',
              color: '#A31346',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <BookmarkIcon sx={{ fontSize: 28 }} />
          </Box>
          <Typography variant="h5" sx={{ color: '#241019', mb: 1, fontWeight: 700 }}>
            Track and organize your saved jobs
          </Typography>
          <Typography variant="body2" sx={{ color: '#8A6E76', mb: 3, lineHeight: 1.6 }}>
            Sign in or create an account to save job listings, track your application progress, and organize your job search.
          </Typography>
          <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              onClick={() => navigate('/register')}
              sx={{ bgcolor: '#E8336D', color: '#FFFFFF', fontWeight: 700, px: 3, py: 1 }}
            >
              Get started
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/login')}
              sx={{ borderColor: '#E8336D', color: '#A31346', fontWeight: 600, px: 3, py: 1 }}
            >
              Sign in
            </Button>
          </Box>
        </Paper>
      ) : (
        <>
          {/* KPI Stat Summary Cards */}
          <Grid container spacing={2} mb={3}>
            {/* Saved Jobs Card */}
            <Grid item xs={12} sm={4}>
              <Paper
                onClick={() => setFilterTab('saved')}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: filterTab === 'saved' ? '#E8336D' : '#EFE6E8',
                  bgcolor: filterTab === 'saved' ? '#FFF5F8' : '#FFFFFF',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#E8336D',
                    boxShadow: '0 4px 16px rgba(232, 51, 109, 0.08)',
                  },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" sx={{ color: '#8A6E76', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Saved (To Apply)
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#241019', fontWeight: 800, mt: 0.5 }}>
                      {savedOnlyCount}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      bgcolor: '#FFF0F4',
                      color: '#E8336D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <BookmarkIcon fontSize="small" />
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ color: '#8A6E76', mt: 1, display: 'block' }}>
                  {savedOnlyCount === 1 ? '1 job waiting for application' : `${savedOnlyCount} jobs waiting for application`}
                </Typography>
              </Paper>
            </Grid>

            {/* Applied Jobs Card */}
            <Grid item xs={12} sm={4}>
              <Paper
                onClick={() => setFilterTab('applied')}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: filterTab === 'applied' ? '#16a34a' : '#EFE6E8',
                  bgcolor: filterTab === 'applied' ? '#F0FDF4' : '#FFFFFF',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#16a34a',
                    boxShadow: '0 4px 16px rgba(22, 163, 74, 0.08)',
                  },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" sx={{ color: '#8A6E76', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Applied
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#15803d', fontWeight: 800, mt: 0.5 }}>
                      {appliedCount}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      bgcolor: '#DCFCE7',
                      color: '#15803d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircleIcon fontSize="small" />
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ color: '#8A6E76', mt: 1, display: 'block' }}>
                  {appliedCount === 1 ? '1 application submitted' : `${appliedCount} applications submitted`}
                </Typography>
              </Paper>
            </Grid>

            {/* Total Tracked Card */}
            <Grid item xs={12} sm={4}>
              <Paper
                onClick={() => setFilterTab('all')}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: filterTab === 'all' ? '#241019' : '#EFE6E8',
                  bgcolor: filterTab === 'all' ? '#FAF8F9' : '#FFFFFF',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#241019',
                    boxShadow: '0 4px 16px rgba(36, 16, 25, 0.08)',
                  },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" sx={{ color: '#8A6E76', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      All Tracked
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#241019', fontWeight: 800, mt: 0.5 }}>
                      {totalCount}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      bgcolor: '#F3EBF0',
                      color: '#241019',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <WorkIcon fontSize="small" />
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ color: '#8A6E76', mt: 1, display: 'block' }}>
                  Total jobs in your career pipeline
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Filter Sub-Tabs */}
          <Box display="flex" gap={1.5} mb={3} flexWrap="wrap">
            <Button
              variant={filterTab === 'saved' ? 'contained' : 'outlined'}
              onClick={() => setFilterTab('saved')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                px: 2.5,
                py: 0.75,
                bgcolor: filterTab === 'saved' ? '#E8336D' : '#FFFFFF',
                color: filterTab === 'saved' ? '#FFFFFF' : '#8A6E76',
                borderColor: filterTab === 'saved' ? '#E8336D' : '#EFE6E8',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: filterTab === 'saved' ? '#A31346' : '#FFF0F4',
                  borderColor: '#E8336D',
                  boxShadow: 'none',
                },
              }}
            >
              Saved Jobs ({savedOnlyCount})
            </Button>
            <Button
              variant={filterTab === 'applied' ? 'contained' : 'outlined'}
              onClick={() => setFilterTab('applied')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                px: 2.5,
                py: 0.75,
                bgcolor: filterTab === 'applied' ? '#16a34a' : '#FFFFFF',
                color: filterTab === 'applied' ? '#FFFFFF' : '#16a34a',
                borderColor: filterTab === 'applied' ? '#16a34a' : '#BBF7D0',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: filterTab === 'applied' ? '#15803d' : '#DCFCE7',
                  borderColor: '#16a34a',
                  boxShadow: 'none',
                },
              }}
            >
              Applied ({appliedCount})
            </Button>
            <Button
              variant={filterTab === 'all' ? 'contained' : 'outlined'}
              onClick={() => setFilterTab('all')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                px: 2.5,
                py: 0.75,
                bgcolor: filterTab === 'all' ? '#241019' : '#FFFFFF',
                color: filterTab === 'all' ? '#FFFFFF' : '#8A6E76',
                borderColor: filterTab === 'all' ? '#241019' : '#EFE6E8',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: filterTab === 'all' ? '#11070c' : '#FAF8F9',
                  borderColor: '#241019',
                  boxShadow: 'none',
                },
              }}
            >
              All Tracked ({totalCount})
            </Button>
          </Box>

          {/* Cards Grid */}
          <Grid container spacing={2.5}>
            {displayedJobs.map((job) => (
              <Grid item xs={12} md={6} key={job.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    bgcolor: '#FFFFFF',
                    border: '1px solid',
                    borderColor: job.appliedManually ? '#BBF7D0' : '#EFE6E8',
                    borderRadius: 3,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: job.appliedManually ? '#86EFAC' : '#D8C3C9',
                      boxShadow: '0 6px 20px rgba(36, 16, 25, 0.05)',
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                    {job.title ? (
                      <>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1} gap={1}>
                          <Typography variant="h6" sx={{ fontSize: { xs: '1.05rem', sm: '1.15rem' }, color: '#241019', lineHeight: 1.3, fontWeight: 700 }}>
                            {job.title}
                          </Typography>
                          {job.appliedManually ? (
                            <Chip
                              icon={<CheckCircleIcon sx={{ fontSize: '15px !important', color: '#15803d !important' }} />}
                              label="Applied"
                              size="small"
                              sx={{
                                bgcolor: '#DCFCE7',
                                color: '#15803d',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                border: '1px solid #BBF7D0',
                                pl: 0.5,
                              }}
                            />
                          ) : (
                            <Chip
                              label="To Apply"
                              size="small"
                              sx={{
                                bgcolor: '#FFF0F4',
                                color: '#A31346',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                border: '1px solid #FFD9E4',
                              }}
                            />
                          )}
                        </Box>

                        <Typography variant="body2" sx={{ color: '#8A6E76', fontWeight: 500, mb: 1.5 }}>
                          {job.company} — <Box component="span" sx={{ color: '#241019' }}>{job.location}</Box>
                        </Typography>

                        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                          {job.platform && (
                            <Chip
                              label={job.platform}
                              size="small"
                              sx={{ bgcolor: '#FFF9FA', color: '#8A6E76', border: '1px solid #EFE6E8', fontSize: '0.75rem' }}
                            />
                          )}
                          {job.salaryRange && (
                            <Chip
                              label={job.salaryRange}
                              size="small"
                              sx={{ bgcolor: '#FFF9FA', color: '#241019', fontWeight: 600, fontSize: '0.75rem' }}
                            />
                          )}
                        </Box>
                      </>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#8A6E76', fontStyle: 'italic' }}>
                        This job listing is no longer available from its original source.
                      </Typography>
                    )}

                    <Typography variant="caption" sx={{ color: '#8A6E76', display: 'block', mt: 1 }}>
                      Saved on {new Date(job.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ px: { xs: 2.5, sm: 3 }, pb: { xs: 2.5, sm: 3 }, pt: 0, display: 'flex', gap: 1 }}>
                    {job.sourceUrl && (
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
                          flexGrow: 1,
                          borderRadius: 2,
                          '&:hover': { bgcolor: '#A31346' },
                        }}
                      >
                        View & Apply
                      </Button>
                    )}

                    <Tooltip title={job.appliedManually ? 'Mark as not applied' : 'Mark as applied'}>
                      <IconButton
                        disabled={busyId === job.id}
                        onClick={() => handleToggleApplied(job)}
                        sx={{
                          border: '1px solid',
                          borderColor: job.appliedManually ? '#86EFAC' : '#EFE6E8',
                          borderRadius: 2,
                          color: job.appliedManually ? '#15803d' : '#8A6E76',
                          bgcolor: job.appliedManually ? '#DCFCE7' : 'transparent',
                          '&:hover': { borderColor: '#15803d', bgcolor: '#DCFCE7' },
                        }}
                      >
                        {job.appliedManually ? <CheckCircleIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Remove from saved">
                      <IconButton
                        disabled={busyId === job.id}
                        onClick={() => handleUnsave(job)}
                        sx={{
                          border: '1px solid #EFE6E8',
                          borderRadius: 2,
                          color: '#8A6E76',
                          '&:hover': { borderColor: '#E8336D', color: '#A31346', bgcolor: '#FFD9E4' },
                        }}
                      >
                        <BookmarkRemoveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}

            {/* When Tab has 0 jobs but user has jobs in the other tab */}
            {totalCount > 0 && displayedJobs.length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 5, textAlign: 'center', bgcolor: '#FFFFFF', borderRadius: 3, border: '1px dashed #EFE6E8' }}>
                  <Typography variant="h6" sx={{ color: '#241019', mb: 1, fontWeight: 700 }}>
                    {filterTab === 'saved' ? 'No pending saved jobs' : 'No applied jobs yet'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8A6E76', mb: 2.5 }}>
                    {filterTab === 'saved'
                      ? `All of your saved jobs are currently marked as applied! You have ${appliedCount} job(s) in your Applied list.`
                      : `You have ${savedOnlyCount} job(s) in your Saved list ready to apply! Click the checkmark on any job card when you submit an application.`}
                  </Typography>
                  <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
                    {filterTab === 'saved' ? (
                      <Button
                        variant="contained"
                        onClick={() => setFilterTab('applied')}
                        sx={{ bgcolor: '#16a34a', color: '#FFFFFF', fontWeight: 700, '&:hover': { bgcolor: '#15803d' } }}
                      >
                        View Applied Jobs ({appliedCount})
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={() => setFilterTab('saved')}
                        sx={{ bgcolor: '#E8336D', color: '#FFFFFF', fontWeight: 700, '&:hover': { bgcolor: '#A31346' } }}
                      >
                        View Saved Jobs ({savedOnlyCount})
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/jobs')}
                      endIcon={<ArrowForwardIcon fontSize="small" />}
                      sx={{ borderColor: '#EFE6E8', color: '#241019', fontWeight: 600 }}
                    >
                      Browse Job Feed
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            )}

            {/* Total 0 jobs tracked */}
            {totalCount === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#FFFFFF', borderRadius: 3, border: '1px solid #EFE6E8' }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      bgcolor: '#FFF0F4',
                      color: '#E8336D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <BookmarkIcon fontSize="medium" />
                  </Box>
                  <Typography variant="h6" sx={{ color: '#241019', mb: 1, fontWeight: 700 }}>
                    No saved jobs yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8A6E76', mb: 3, maxWidth: 440, mx: 'auto' }}>
                    Browse listings on the Job Feed and click the bookmark icon on any card to save jobs and track your applications here.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/jobs')}
                    endIcon={<ArrowForwardIcon fontSize="small" />}
                    sx={{ bgcolor: '#E8336D', color: '#FFFFFF', fontWeight: 700, px: 3, py: 1 }}
                  >
                    Explore Job Feed
                  </Button>
                </Paper>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Box>
  );
}
