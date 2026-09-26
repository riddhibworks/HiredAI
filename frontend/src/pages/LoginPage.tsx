import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, IconButton, InputAdornment, Link, Paper, TextField, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      setAuth(res.token, res.userId, res.email);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Login failed — please check your credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ bgcolor: '#FFF9FA', p: 2 }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 420,
          borderRadius: 3.5,
          border: '1px solid #EFE6E8',
          boxShadow: '0 8px 32px rgba(36, 16, 25, 0.05)',
        }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: '#FFD9E4',
              color: '#A31346',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1.5,
            }}
          >
            <LockOutlinedIcon />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#241019' }}>
            Welcome back to Hired<Box component="span" sx={{ color: '#E8336D' }}>AI</Box>
          </Typography>
          <Typography variant="body2" sx={{ color: '#8A6E76', mt: 0.5 }}>
            Sign in to access your saved remote jobs & resume matcher
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email address"
            type="email"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword((show) => !show)}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                    sx={{ color: '#8A6E76', outline: 'none !important' }}
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              mt: 3,
              py: 1.2,
              bgcolor: '#E8336D',
              color: '#FFFFFF',
              fontWeight: 700,
              '&:hover': { bgcolor: '#A31346' },
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <Box textAlign="center" mt={3} pt={2} sx={{ borderTop: '1px solid #EFE6E8' }}>
          <Typography variant="body2" sx={{ color: '#8A6E76' }}>
            Don't have an account?{' '}
            <Link component={RouterLink} to="/register" sx={{ color: '#A31346', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
              Register for free
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
