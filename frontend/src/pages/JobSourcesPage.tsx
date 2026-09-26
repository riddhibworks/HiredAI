import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import ApiIcon from '@mui/icons-material/Api';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { jobSourcesApi } from '../api/jobSources';
import type { BuiltInJobSourceResponse, JobSourceRequest, JobSourceResponse, JobSourceType, ParsedJobPreview } from '../types/api';

const EMPTY_FORM: JobSourceRequest = {
  name: '',
  feedUrl: '',
  sourceType: 'RSS',
  listPath: '',
  titlePath: '',
  companyPath: '',
  locationPath: '',
  descriptionPath: '',
  urlPath: '',
  externalIdPath: '',
  postedAtPath: '',
};

export default function JobSourcesPage() {
  const [sources, setSources] = useState<JobSourceResponse[]>([]);
  const [builtInSources, setBuiltInSources] = useState<BuiltInJobSourceResponse[]>([]);
  const [form, setForm] = useState<JobSourceRequest>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewResults, setPreviewResults] = useState<ParsedJobPreview[] | null>(null);

  const load = () => {
    jobSourcesApi.list().then(setSources).catch(() => setError('Failed to load job sources'));
    jobSourcesApi.listBuiltIn().then(setBuiltInSources).catch(() => {});
  };

  useEffect(load, []);

  const updateField = (field: keyof JobSourceRequest, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setPreviewResults(null);
  };

  const handleTypeChange = (type: JobSourceType | null) => {
    if (!type) return;
    setForm((f) => ({ ...f, sourceType: type }));
    setPreviewResults(null);
  };

  const handlePreview = async () => {
    setError(null);
    setPreviewResults(null);
    if (!form.feedUrl.trim()) {
      setError('Feed URL is required to preview');
      return;
    }
    setPreviewing(true);
    try {
      const results = await jobSourcesApi.preview(form);
      setPreviewResults(results);
      if (results.length === 0) {
        setError('Fetched successfully, but no jobs were found — check your field mappings.');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to preview this feed');
    } finally {
      setPreviewing(false);
    }
  };

  const handleAdd = async () => {
    setError(null);
    if (!form.name.trim() || !form.feedUrl.trim()) {
      setError('Source name and feed URL are required');
      return;
    }
    if (form.sourceType === 'JSON_API' && (!form.listPath?.trim() || !form.titlePath?.trim() || !form.urlPath?.trim())) {
      setError('JSON sources require at least a list path, title path, and URL path');
      return;
    }
    setSubmitting(true);
    try {
      await jobSourcesApi.create(form);
      setForm(EMPTY_FORM);
      setPreviewResults(null);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to add job source');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (source: JobSourceResponse) => {
    try {
      await jobSourcesApi.toggle(source.id);
      load();
    } catch {
      setError('Failed to update job source status');
    }
  };

  const handleDelete = async (source: JobSourceResponse) => {
    try {
      await jobSourcesApi.remove(source.id);
      load();
    } catch {
      setError('Failed to remove job source');
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        maxWidth: 860,
        mx: 'auto',
        borderRadius: 3.5,
        bgcolor: '#FFFFFF',
        border: '1px solid #EFE6E8',
      }}
    >
      <Box display="flex" alignItems="center" gap={1.5} mb={1}>
        <RssFeedIcon sx={{ color: '#E8336D', fontSize: 28 }} />
        <Typography variant="h4" sx={{ color: '#241019' }}>
          Job Sources & Feeds
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: '#8A6E76', mb: 3 }}>
        Connect public RSS/Atom feeds or custom JSON APIs from remote job boards to automatically ingest their listings into your unified feed.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Built-in Sources Section */}
      <Box mb={4}>
        <Typography variant="h6" sx={{ fontSize: '1.05rem', color: '#241019', mb: 0.5 }}>
          Built-in platforms
        </Typography>
        <Typography variant="body2" sx={{ color: '#8A6E76', mb: 2 }}>
          These remote platforms are checked automatically on every refresh run.
        </Typography>
        <Box display="flex" gap={1.5} flexWrap="wrap">
          {builtInSources.map((source) => (
            <Chip
              key={source.name}
              icon={source.active ? <CheckCircleIcon sx={{ fontSize: '16px !important', color: '#A31346 !important' }} /> : undefined}
              label={source.active ? source.name : `${source.name} (needs API key)`}
              sx={{
                bgcolor: source.active ? '#FFD9E4' : '#FFF9FA',
                color: source.active ? '#A31346' : '#8A6E76',
                border: '1px solid #EFE6E8',
                fontWeight: 600,
                fontSize: '0.85rem',
                py: 0.5,
              }}
            />
          ))}
        </Box>
      </Box>

      <Divider sx={{ mb: 4, borderColor: '#EFE6E8' }} />

      {/* Add Custom Source Section */}
      <Typography variant="h6" sx={{ fontSize: '1.05rem', color: '#241019', mb: 1 }}>
        Add custom job source
      </Typography>

      <ToggleButtonGroup
        value={form.sourceType}
        exclusive
        onChange={(_, value) => handleTypeChange(value)}
        size="small"
        sx={{
          mb: 3,
          '& .MuiToggleButton-root': {
            textTransform: 'none',
            fontWeight: 600,
            color: '#8A6E76',
            borderColor: '#EFE6E8',
            '&.Mui-selected': {
              bgcolor: '#FFD9E4',
              color: '#A31346',
              borderColor: '#E8336D',
            },
          },
        }}
      >
        <ToggleButton value="RSS">
          <RssFeedIcon fontSize="small" sx={{ mr: 1 }} /> RSS / Atom feed
        </ToggleButton>
        <ToggleButton value="JSON_API">
          <ApiIcon fontSize="small" sx={{ mr: 1 }} /> JSON API
        </ToggleButton>
      </ToggleButtonGroup>

      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <TextField
          label="Source name"
          placeholder="e.g. Remote Python Jobs"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          size="small"
          sx={{ minWidth: 220 }}
        />
        <TextField
          label={form.sourceType === 'JSON_API' ? 'API Endpoint URL' : 'Feed URL (RSS/Atom)'}
          placeholder="https://example.com/feed.xml"
          value={form.feedUrl}
          onChange={(e) => updateField('feedUrl', e.target.value)}
          size="small"
          sx={{ flexGrow: 1, minWidth: 320 }}
        />
      </Box>

      {form.sourceType === 'JSON_API' && (
        <Box mb={3} p={2.5} sx={{ bgcolor: '#FFF9FA', borderRadius: 2.5, border: '1px solid #EFE6E8' }}>
          <Typography variant="caption" sx={{ color: '#8A6E76', display: 'block', mb: 1.5 }}>
            Dot-paths into JSON response, e.g. for <code>{'{ "data": { "jobs": [{ "title": "..." }] } }'}</code> set List path to <code>data.jobs</code>.
          </Typography>
          <Box display="flex" gap={1.5} flexWrap="wrap">
            <TextField label="List path *" value={form.listPath} onChange={(e) => updateField('listPath', e.target.value)} size="small" />
            <TextField label="Title path *" value={form.titlePath} onChange={(e) => updateField('titlePath', e.target.value)} size="small" />
            <TextField label="URL path *" value={form.urlPath} onChange={(e) => updateField('urlPath', e.target.value)} size="small" />
            <TextField label="Company path" value={form.companyPath} onChange={(e) => updateField('companyPath', e.target.value)} size="small" />
            <TextField label="Location path" value={form.locationPath} onChange={(e) => updateField('locationPath', e.target.value)} size="small" />
            <TextField label="Description path" value={form.descriptionPath} onChange={(e) => updateField('descriptionPath', e.target.value)} size="small" />
          </Box>
        </Box>
      )}

      <Box display="flex" gap={2} mb={3}>
        <Button
          variant="outlined"
          onClick={handlePreview}
          disabled={previewing}
          sx={{
            borderColor: '#E8336D',
            color: '#A31346',
            fontWeight: 600,
            '&:hover': { borderColor: '#A31346', bgcolor: '#FFD9E4' },
          }}
        >
          {previewing ? 'Fetching preview…' : 'Preview feed'}
        </Button>
        <Button
          variant="contained"
          onClick={handleAdd}
          disabled={submitting}
          sx={{
            bgcolor: '#E8336D',
            color: '#FFFFFF',
            fontWeight: 700,
            '&:hover': { bgcolor: '#A31346' },
          }}
        >
          {submitting ? 'Adding…' : 'Add custom source'}
        </Button>
      </Box>

      {/* Preview Results */}
      {previewResults && previewResults.length > 0 && (
        <Box mb={4}>
          <Typography variant="subtitle2" sx={{ color: '#A31346', mb: 1, fontWeight: 700 }}>
            Feed Preview ({previewResults.length} parsed listings)
          </Typography>
          {previewResults.map((job, i) => (
            <Card key={i} sx={{ mb: 1, bgcolor: '#FFF9FA', border: '1px solid #EFE6E8' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#241019' }}>
                  {job.title || '(No title resolved)'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#8A6E76' }}>
                  {job.company || 'Unknown Company'} {job.location ? `· ${job.location}` : ''}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Divider sx={{ mb: 3, borderColor: '#EFE6E8' }} />

      {/* Configured Custom Sources List */}
      <Typography variant="h6" sx={{ fontSize: '1.05rem', color: '#241019', mb: 1.5 }}>
        Configured custom sources
      </Typography>

      <List disablePadding>
        {sources.map((source) => (
          <ListItem
            key={source.id}
            sx={{
              mb: 1.5,
              p: 2,
              borderRadius: 2.5,
              border: '1px solid #EFE6E8',
              bgcolor: '#FFFFFF',
            }}
            secondaryAction={
              <Box display="flex" alignItems="center" gap={1}>
                <Switch
                  checked={source.enabled}
                  onChange={() => handleToggle(source)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#E8336D',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#E8336D',
                    },
                  }}
                />
                {source.ownedByCurrentUser && (
                  <Tooltip title="Delete source">
                    <IconButton edge="end" onClick={() => handleDelete(source)} sx={{ color: '#8A6E76', '&:hover': { color: '#A31346' } }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            }
          >
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#241019' }}>
                    {source.name}
                  </Typography>
                  <Chip
                    label={source.sourceType === 'JSON_API' ? 'JSON API' : 'RSS Feed'}
                    size="small"
                    sx={{ bgcolor: '#FFF9FA', color: '#8A6E76', border: '1px solid #EFE6E8', fontSize: '0.75rem' }}
                  />
                  {!source.enabled && (
                    <Chip label="Disabled" size="small" sx={{ bgcolor: '#FFF9FA', color: '#8A6E76', fontSize: '0.75rem' }} />
                  )}
                </Box>
              }
              secondary={source.feedUrl}
              secondaryTypographyProps={{ fontSize: '0.8rem', color: '#8A6E76' }}
            />
          </ListItem>
        ))}
        {sources.length === 0 && (
          <Typography variant="body2" sx={{ color: '#8A6E76', italic: true }}>
            No custom sources added yet.
          </Typography>
        )}
      </List>
    </Paper>
  );
}
