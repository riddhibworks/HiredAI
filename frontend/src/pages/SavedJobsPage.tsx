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
  Tooltip,
  Typography,
} from '@mui/material';
import BookmarkRemoveIcon from '@mui/icons-material/BookmarkRemove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import BookmarkIcon from '@mui/icons-material/Bookmark';

import { useAuthStore } from '../store/authStore';
import { savedJobsApi } from '../api/savedJobs';
import type { SavedJobResponse } from '../types/api';

export default function SavedJobsPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const [savedJobs, setSavedJobs] = useState<SavedJobResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'saved' | 'applied'>('all');

  const load = () => {
    if (token) {
      savedJobsApi.list().then(setSavedJobs).catch(() => setError('Failed to load saved jobs'));
    }
  };

  useEffect(load, [token]);

  const handleUnsave = async (job: SavedJobResponse) => {
    setBusyId(job.id);
    try {
      await savedJobsApi.unsave(job.jobListingId);
      setSavedJobs((prev) => prev.filter((j) => j.id !== job.id));
      load();
    } catch (err: any) {
      console.error('[SavedJobs] unsave failed:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to remove saved job';
      setError(msg);
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleApplied = async (job: SavedJobResponse) => {
    setBusyId(job.id);
    try {
      const nextApplied = !job.appliedManually;
      await savedJobsApi.markApplied(job.jobListingId, nextApplied);
      setSavedJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, appliedManually: nextApplied } : j))
      );
      load();
    } catch (err: any) {
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
      <Box display="flex" alignItems="center" gap={1.5} mb={1}>
        <BookmarkIcon sx={{ color: '#E8336D', fontSize: 28 }} />
        <Typography variant="h4" sx={{ color: '#241019' }}>
          Saved Jobs & Applications
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: '#8A6E76', mb: 3 }}>
        Track jobs you want to apply for and monitor your submitted applications
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

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
          {totalCount > 0 && (
            <Box display="flex" gap={1.5} mb={3} flexWrap="wrap">
              <Button
                variant={filterTab === 'all' ? 'contained' : 'outlined'}
                onClick={() => setFilterTab('all')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  px: 2,
                  py: 0.75,
                  bgcolor: filterTab === 'all' ? '#E8336D' : '#FFFFFF',
                  color: filterTab === 'all' ? '#FFFFFF' : '#8A6E76',
                  borderColor: filterTab === 'all' ? '#E8336D' : '#EFE6E8',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: filterTab === 'all' ? '#A31346' : '#FFF0F4',
                    borderColor: '#E8336D',
                    boxShadow: 'none',
                  },
                }}
              >
                All Jobs ({totalCount})
              </Button>
              <Button
                variant={filterTab === 'saved' ? 'contained' : 'outlined'}
                onClick={() => setFilterTab('saved')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  px: 2,
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
                Saved / To Apply ({savedOnlyCount})
              </Button>
              <Button
                variant={filterTab === 'applied' ? 'contained' : 'outlined'}
                onClick={() => setFilterTab('applied')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  px: 2,
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
            </Box>
          )}

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
                    border: '1px solid #EFE6E8',
                    borderRadius: 3,
                    '&:hover': {
                      borderColor: '#D8C3C9',
                      boxShadow: '0 6px 20px rgba(36, 16, 25, 0.05)',
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                    {job.title ? (
                      <>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1} gap={1}>
                          <Typography variant="h6" sx={{ fontSize: { xs: '1.05rem', sm: '1.15rem' }, color: '#241019', lineHeight: 1.3 }}>
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
                          border: '1px solid #EFE6E8',
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

            {totalCount > 0 && displayedJobs.length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 5, textAlign: 'center', bgcolor: '#FFFFFF', borderRadius: 3, border: '1px dashed #EFE6E8' }}>
                  <Typography variant="h6" sx={{ color: '#241019', mb: 1, fontWeight: 600 }}>
                    {filterTab === 'applied' ? 'No applied jobs yet' : 'No unapplied jobs'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8A6E76', mb: 2 }}>
                    {filterTab === 'applied'
                      ? 'Click the checkmark icon on any saved job to mark it as applied.'
                      : 'All of your saved jobs are currently marked as applied!'}
                  </Typography>
                  <Button
                    variant="text"
                    onClick={() => setFilterTab('all')}
                    sx={{ color: '#E8336D', fontWeight: 600 }}
                  >
                    View All Saved Jobs ({totalCount})
                  </Button>
                </Paper>
              </Grid>
            )}

            {totalCount === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#FFFFFF', borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ color: '#241019', mb: 1 }}>
                    No saved jobs yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8A6E76' }}>
                    Browse the Job Feed and click the bookmark icon on any card to save it here.
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Box>
  );
}
