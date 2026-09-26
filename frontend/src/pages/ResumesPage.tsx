import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Alert,
  Box,
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

import { resumeApi } from '../api/resumes';
import type { ResumeResponse } from '../types/api';

export default function ResumesPage() {
  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => resumeApi.list().then(setResumes).catch(() => setError('Failed to load resumes'));

  useEffect(() => {
    load();
  }, []);

  const onDrop = useCallback((files: File[]) => {
    setError(null);
    files.forEach((file) => {
      resumeApi
        .upload(file, file.name)
        .then(() => load())
        .catch(() => setError(`Failed to upload ${file.name}`));
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
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

      {/* Drag & Drop Upload Zone */}
      <Paper
        {...getRootProps()}
        elevation={0}
        sx={{
          p: 5,
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
        <Typography variant="h6" sx={{ fontSize: '1.1rem', color: '#241019', mb: 0.5 }}>
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
          <ListItem
            key={r.id}
            component={Paper}
            elevation={0}
            sx={{
              mb: 1.5,
              p: 2,
              borderRadius: 2.5,
              border: '1px solid #EFE6E8',
              bgcolor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
            }}
            secondaryAction={
              <Tooltip title="Delete resume">
                <IconButton edge="end" onClick={() => handleDelete(r.id)} sx={{ color: '#8A6E76', '&:hover': { color: '#A31346' } }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            }
          >
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
                mr: 2,
                color: '#E8336D',
              }}
            >
              <DescriptionIcon />
            </Box>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#241019' }}>
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
              }
              secondary={`Uploaded ${new Date(r.uploadedAt).toLocaleDateString()}`}
              secondaryTypographyProps={{ fontSize: '0.8rem', color: '#8A6E76' }}
            />
          </ListItem>
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
  );
}
