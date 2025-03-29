import { useState } from 'react';
import {
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  FormControlLabel,
  Checkbox,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Box
        sx={{
          width: '600px',
          height: '490px',
          backgroundColor: 'white',
          borderRadius: '4px',
          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            flex: 1,
            padding: '30px 40px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            align="center" 
            sx={{ 
              color: '#224080', 
              fontWeight: 500,
              mb: 2
            }}
          >
            Login
          </Typography>
          
          <Divider sx={{ mb: 3 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ px: 1 }}>
            <Typography variant="body1" sx={{ mb: 1, fontWeight: 400 }}>
              Seu e-mail
            </Typography>
            <TextField
              type="email"
              fullWidth
              placeholder="contato@minhaempresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              variant="outlined"
              size="small"
              InputProps={{
                sx: { borderRadius: 1 }
              }}
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body1" sx={{ mb: 1, fontWeight: 400 }}>
              Sua senha
            </Typography>
            <TextField
              type="password"
              fullWidth
              placeholder="1234"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              variant="outlined"
              size="small"
              InputProps={{
                sx: { borderRadius: 1 }
              }}
              sx={{ mb: 1 }}
            />
            
            <FormControlLabel
              control={
                <Checkbox 
                  name="remember" 
                  color="primary" 
                  size="small"
                />
              }
              label={
                <Typography variant="body2">
                  Manter-me logado
                </Typography>
              }
              sx={{ mt: 0.5 }}
            />
            
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ 
                mt: 2, 
                py: 1, 
                borderRadius: 1,
                textTransform: 'none',
                backgroundColor: '#224080',
                '&:hover': {
                  backgroundColor: '#162C5C',
                }
              }}
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Logar'}
            </Button>
          </Box>
        </Box>
        
        <Box
          sx={{
            backgroundColor: '#E6EAF5',
            padding: '15px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Typography variant="body2" color="textSecondary">
            Ainda não tem conta?
          </Typography>
          <Button 
            color="primary" 
            size="small" 
            disabled={true}
            sx={{ 
              textTransform: 'none',
              backgroundColor: 'white',
              border: '1px solid #224080',
              borderRadius: '4px',
              padding: '2px 10px',
              fontSize: '0.75rem',
              color: '#224080',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            Cadastre-se
          </Button>
        </Box>
      </Box>
    </Box>
  );
};