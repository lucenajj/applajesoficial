import { useEffect, useState } from 'react';
import { Container, Typography, Grid, Paper, Box, Card, CardContent, Divider, CircularProgress, Alert, Avatar } from '@mui/material';
import { supabase } from '../lib/supabase';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalculateIcon from '@mui/icons-material/Calculate';

type Metrics = {
  customerCount: number;
  userCount: number;
  totalSales: number;
  totalCalculations: number;
};

export const HomePage = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    customerCount: 0,
    userCount: 0,
    totalSales: 0,
    totalCalculations: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [customersResponse, usersResponse, calculationsResponse] = await Promise.all([
          supabase.from('customers').select('count', { count: 'exact' }),
          supabase.from('users').select('count', { count: 'exact' }),
          supabase.from('calculations').select('*')
        ]);

        if (customersResponse.error) throw new Error(customersResponse.error.message);
        if (usersResponse.error) throw new Error(usersResponse.error.message);
        if (calculationsResponse.error) throw new Error(calculationsResponse.error.message);

        const customerCount = customersResponse.count || 0;
        const userCount = usersResponse.count || 0;
        const calculations = calculationsResponse.data || [];
        const totalSales = calculations.reduce((sum, calc) => sum + (calc.total_cost || 0), 0);

        setMetrics({
          customerCount,
          userCount,
          totalSales,
          totalCalculations: calculations.length
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
        setError('Falha ao carregar métricas do dashboard. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const MetricCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) => (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        width: '100%',
        height: '100%',
        borderRadius: 2,
        border: '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: color, color: 'white', mr: 2 }}>
            {icon}
          </Avatar>
          <Typography variant="h6" color="text.secondary" fontWeight="medium">
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mt: 2 }}>
          {value}
        </Typography>
      </CardContent>
    </Paper>
  );

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100%', 
      px: { xs: 2, sm: 4, md: 6 }, 
      py: 4,
      boxSizing: 'border-box',
    }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Bem-vindo ao painel de controle do Cálculo de Orçamentos. Aqui você encontra uma visão geral do seu negócio.
      </Typography>
      <Divider sx={{ my: 3 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3} sx={{ mt: 1, width: '100%', mx: 0 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard 
              title="Clientes" 
              value={metrics.customerCount} 
              icon={<PeopleIcon />}
              color="#1976d2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard 
              title="Usuários" 
              value={metrics.userCount} 
              icon={<PersonIcon />}
              color="#2e7d32"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard 
              title="Total Vendido" 
              value={`R$ ${metrics.totalSales.toFixed(2)}`} 
              icon={<AttachMoneyIcon />}
              color="#ed6c02"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard 
              title="Orçamentos" 
              value={metrics.totalCalculations} 
              icon={<CalculateIcon />}
              color="#9c27b0"
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};