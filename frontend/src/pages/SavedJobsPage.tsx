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
      load();
    } catch {
      setError('Failed to remove saved job');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleApplied = async (job: SavedJobResponse) => {
    setBusyId(job.id);
    try {
      await savedJobsApi.markApplied(job.jobListingId, !job.appliedManually);
      load();
    } catch {
      setError('Failed to update applied status');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1.5} mb={1}>
        <BookmarkIcon sx={{ color: '#E8336D', fontSize: 28 }} />
        <Typography variant="h4" sx={{ color: '#241019' }}>
          Saved Jobs
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: '#8A6E76', mb: 3 }}>
        Track jobs you want to apply for or keep as reference
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
        <Grid container spacing={2.5}>
        {savedJobs.map((job) => (
          <Grid item xs={12} md={6} key={job.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                bgcolor: '#FFFFFF',
                border: '1px solid #EFE6E8',
                '&:hover': {
                  borderColor: '#D8C3C9',
                  boxShadow: '0 6px 20px rgba(36, 16, 25, 0.05)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {job.title ? (
                  <>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" sx={{ fontSize: '1.15rem', color: '#241019', lineHeight: 1.3 }}>
                        {job.title}
                      </Typography>
                      {job.appliedManually && (
                        <Chip
                          label="Applied"
                          size="small"
                          sx={{
                            bgcolor: '#FFD9E4',
                            color: '#A31346',
                            fontWeight: 700,
                            fontSize: '0.75rem',
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

              <CardActions sx={{ px: 3, pb: 3, pt: 0, display: 'flex', gap: 1 }}>
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
                      color: job.appliedManually ? '#A31346' : '#8A6E76',
                      bgcolor: job.appliedManually ? '#FFD9E4' : 'transparent',
                      '&:hover': { borderColor: '#A31346', bgcolor: '#FFD9E4' },
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

        {savedJobs.length === 0 && (
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
      )}
    </Box>
  );
}
