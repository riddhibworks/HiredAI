import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { useAuthStore } from '../store/authStore';
import { resumeApi } from '../api/resumes';
import type { ResumeResponse } from '../types/api';

export default function ResumesPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (token) {
      resumeApi.list().then(setResumes).catch(() => setError('Failed to load resumes'));
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const onDrop = useCallback((files: File[], fileRejections: any[]) => {
    setError(null);
    if (fileRejections && fileRejections.length > 0) {
      setError('Please select a valid PDF or DOCX file (up to 10MB).');
    }
    files.forEach((file) => {
      resumeApi
        .upload(file, file.name)
        .then(() => load())
        .catch((err: any) => {
          const message = err?.response?.data?.message || err?.message || 'Upload failed';
          setError(`Failed to upload ${file.name}: ${message}`);
        });
    });
  }, [token]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/x-pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    maxSize: 10 * 1024 * 1024,
  });

  const handleDelete = async (id: string) => {
    await resumeApi.remove(id);
    load();
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 0.5, color: '#241019' }}>
        Resumes
      </Typography>
      <Typography variant="body2" sx={{ color: '#8A6E76', mb: 3 }}>
        Upload your resume (PDF or DOCX) so HiredAI can compute automatic match scores for job feed listings.
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
            <DescriptionIcon sx={{ fontSize: 28 }} />
          </Box>
          <Typography variant="h5" sx={{ color: '#241019', mb: 1, fontWeight: 700 }}>
            Upload your resume for AI match scores
          </Typography>
          <Typography variant="body2" sx={{ color: '#8A6E76', mb: 3, lineHeight: 1.6, maxWidth: 520, mx: 'auto' }}>
            Upload your resume (PDF or DOCX) to get automated match scores across job feed listings. Sign in or create an account to start parsing your resume.
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
        <Box>

      {/* Drag & Drop Upload Zone */}
      <Paper
        {...getRootProps()}
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 5 },
          mb: 4,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: isDragActive ? '#E8336D' : '#D8C3C9',
          bgcolor: isDragActive ? '#FFD9E4' : '#FFFFFF',
          borderRadius: 3.5,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: '#E8336D',
            bgcolor: '#FFF9FA',
          },
        }}
      >
        <input {...getInputProps()} />
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: '#FFD9E4',
            color: '#A31346',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 28 }} />
        </Box>
        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.1rem' }, color: '#241019', mb: 0.5 }}>
          {isDragActive ? 'Drop your resume file here' : 'Drag & drop your resume here, or browse'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#8A6E76' }}>
          Supports PDF or DOCX formats up to 10MB
        </Typography>
      </Paper>

      {/* Uploaded Resumes List */}
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#241019', mb: 1.5 }}>
        Your Uploaded Resumes
      </Typography>

      <List disablePadding>
        {resumes.map((r) => (
          <Paper
            key={r.id}
            elevation={0}
            sx={{
              mb: 1.5,
              p: 2,
              borderRadius: 2.5,
              border: '1px solid #EFE6E8',
              bgcolor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0, flex: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: '#FFF9FA',
                  border: '1px solid #EFE6E8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: '#E8336D',
                }}
              >
                <DescriptionIcon />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#241019', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.label}
                  </Typography>
                  {r.isDefault && (
                    <Chip
                      icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#A31346 !important' }} />}
                      label="Active Matcher"
                      size="small"
                      sx={{ bgcolor: '#FFD9E4', color: '#A31346', fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  )}
                </Box>
                <Typography variant="caption" sx={{ fontSize: '0.8rem', color: '#8A6E76', display: 'block' }}>
                  Uploaded {new Date(r.uploadedAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Delete resume">
              <IconButton onClick={() => handleDelete(r.id)} sx={{ color: '#8A6E76', '&:hover': { color: '#A31346' }, flexShrink: 0 }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Paper>
        ))}

        {resumes.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#FFFFFF', borderRadius: 2.5 }}>
            <Typography variant="body2" sx={{ color: '#8A6E76' }}>
              No resumes uploaded yet. Upload one above to get automated match scores across job listings.
            </Typography>
          </Paper>
        )}
      </List>
        </Box>
      )}
    </Box>
  );
}
