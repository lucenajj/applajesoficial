import { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Box, 
  Card, 
  CardContent, 
  Divider, 
  CircularProgress, 
  Alert, 
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/formatters';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalculateIcon from '@mui/icons-material/Calculate';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimelineIcon from '@mui/icons-material/Timeline';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { addMonths, subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useResponsiveTypography } from '../hooks/useResponsiveTypography';

type TimeRange = '30d' | '90d' | '180d' | '365d' | 'ytd' | 'all';

type Metrics = {
  customerCount: number;
  userCount: number;
  totalSales: number;
  totalCalculations: number;
  averageTicket: number;
  monthlyGrowth: number;
  salesHistory: Array<{
    date: string;
    value: number;
    previousValue?: number;
  }>;
  customerRetention: number;
  previousPeriodSales?: number;
  previousPeriodCalculations?: number;
};

type User = {
  id: string;
  name: string;
};

export const HomePage = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    customerCount: 0,
    userCount: 0,
    totalSales: 0,
    totalCalculations: 0,
    averageTicket: 0,
    monthlyGrowth: 0,
    salesHistory: [],
    customerRetention: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [showComparison, setShowComparison] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userData, setUserData] = useState<{role?: string}>({});
  const typography = useResponsiveTypography();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Log de depuração para verificar o estado atual
  useEffect(() => {
    // Comentado para melhorar o desempenho
    /*
    console.log('Estado atual:', { 
      currentUser, 
      selectedUser, 
      userRole: userData?.role,
      timeRange
    });
    */
  }, [currentUser, selectedUser, userData, timeRange]);

  const getDateRange = (range: TimeRange): { start: Date; end: Date; previousStart: Date; previousEnd: Date } => {
    const now = new Date();
    let start: Date;
    let end = now;
    
    switch (range) {
      case '30d':
        start = subMonths(now, 1);
        break;
      case '90d':
        start = subMonths(now, 3);
        break;
      case '180d':
        start = subMonths(now, 6);
        break;
      case '365d':
        start = subMonths(now, 12);
        break;
      case 'ytd':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
      default:
        start = new Date(2000, 0, 1); // Data bem antiga para pegar todos os registros
        break;
    }

    const duration = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - duration);
    const previousEnd = new Date(end.getTime() - duration);

    return { start, end, previousStart, previousEnd };
  };

  // Obter o usuário atual
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user.id);
        
        // Buscar dados do usuário incluindo a role
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (!error && data) {
          setUserData(data);
          console.log('Dados do usuário carregados:', data);
        }
      }
    };
    
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, role')
          .order('name');

        if (error) throw error;
        
        setUsers(data?.map(user => ({
          id: user.id,
          name: `${user.name} (${user.role === 'admin' ? 'Admin' : 'Vendedor'})`
        })) || []);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Verificar que temos dados do usuário antes de continuar
        if (!userData || !currentUser) {
          // Comentado para melhorar o desempenho
          // console.log('Aguardando dados do usuário...');
          return;
        }
        
        const { start, end, previousStart, previousEnd } = getDateRange(timeRange);
        
        // Verificar se o usuário é admin
        const isAdmin = userData?.role === 'admin';
        console.log('Role do usuário:', userData?.role, 'É admin?', isAdmin);
        
        // Filtrar pelo vendedor selecionado (se for admin e um vendedor foi selecionado)
        // Se for admin sem seleção de vendedor, filterByUserId deve ser null para mostrar todos
        let filterByUserId = null;
        
        if (selectedUser) {
          // Se um vendedor foi selecionado, use-o independentemente do papel do usuário
          filterByUserId = selectedUser;
        } else if (!isAdmin) {
          // Se não é admin, filtre pelo próprio usuário
          filterByUserId = currentUser;
        }
        // Se for admin sem seleção, deixe null para mostrar todos
        
        console.log('Filtrando por usuário ID:', filterByUserId);
        
        // Buscar dados básicos - filtrar por vendedor se selecionado ou se for vendedor
        const customersResponse = filterByUserId
          ? await supabase.from('customers')
              .select('count', { count: 'exact' })
              .eq('user_id', filterByUserId)
          : await supabase.from('customers').select('count', { count: 'exact' });
        
        const usersResponse = await supabase.from('users').select('count', { count: 'exact' });
        
        // Filtrar cálculos pelo usuário selecionado ou logado
        const calculationsQuery = filterByUserId
          ? await supabase.from('calculations')
              .select('*')
              .gte('created_at', previousStart.toISOString())
              .lte('created_at', end.toISOString())
              .eq('user_id', filterByUserId)
          : isAdmin 
              ? await supabase.from('calculations')
                  .select('*')
                  .gte('created_at', previousStart.toISOString())
                  .lte('created_at', end.toISOString())
              : await supabase.from('calculations')
                  .select('*')
                  .gte('created_at', previousStart.toISOString())
                  .lte('created_at', end.toISOString())
                  .eq('user_id', currentUser);

        if (customersResponse.error) throw new Error(customersResponse.error.message);
        if (usersResponse.error) throw new Error(usersResponse.error.message);
        if (calculationsQuery.error) throw new Error(calculationsQuery.error.message);

        let calculations = calculationsQuery.data || [];
        console.log('Total de cálculos encontrados:', calculations.length);

        const customerCount = customersResponse.count || 0;
        const userCount = usersResponse.count || 0;

        // Separar cálculos do período atual e anterior
        const currentPeriodCalcs = calculations.filter(
          calc => new Date(calc.created_at) >= start && new Date(calc.created_at) <= end
        );
        const previousPeriodCalcs = calculations.filter(
          calc => new Date(calc.created_at) >= previousStart && new Date(calc.created_at) < start
        );

        console.log('Cálculos período atual:', currentPeriodCalcs.length);

        const totalSales = currentPeriodCalcs.reduce((sum, calc) => sum + (calc.total_cost || 0), 0);
        const previousPeriodSales = previousPeriodCalcs.reduce((sum, calc) => sum + (calc.total_cost || 0), 0);
        
        console.log('Total de vendas calculado:', totalSales);

        // Calcular métricas avançadas
        const averageTicket = currentPeriodCalcs.length > 0 ? totalSales / currentPeriodCalcs.length : 0;
        
        const monthlyGrowth = previousPeriodSales > 0 
          ? ((totalSales - previousPeriodSales) / previousPeriodSales) * 100 
          : 0;

        // Preparar histórico de vendas com comparação
        const salesByMonth = new Map<string, { current: number; previous: number }>();
        
        // Agrupar vendas por mês
        currentPeriodCalcs.forEach(calc => {
          const monthKey = format(new Date(calc.created_at), 'MM/yyyy');
          const current = salesByMonth.get(monthKey)?.current || 0;
          salesByMonth.set(monthKey, { 
            current: current + (calc.total_cost || 0),
            previous: salesByMonth.get(monthKey)?.previous || 0 
          });
        });

        previousPeriodCalcs.forEach(calc => {
          const monthKey = format(addMonths(new Date(calc.created_at), 12), 'MM/yyyy');
          const previous = salesByMonth.get(monthKey)?.previous || 0;
          salesByMonth.set(monthKey, { 
            current: salesByMonth.get(monthKey)?.current || 0,
            previous: previous + (calc.total_cost || 0)
          });
        });

        const salesHistory = Array.from(salesByMonth.entries())
          .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
          .map(([date, values]) => ({
            date,
            value: values.current,
            previousValue: values.previous
          }));

        // Calcular taxa de retenção de clientes
        const totalCustomersWithCalculations = new Set(currentPeriodCalcs.map(calc => calc.customer_id)).size;
        const customerRetention = customerCount > 0 ? (totalCustomersWithCalculations / customerCount) * 100 : 0;

        setMetrics({
          customerCount,
          userCount,
          totalSales,
          totalCalculations: currentPeriodCalcs.length,
          averageTicket,
          monthlyGrowth,
          salesHistory,
          customerRetention,
          previousPeriodSales,
          previousPeriodCalculations: previousPeriodCalcs.length
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
        setError('Falha ao carregar métricas do dashboard. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchMetrics();
    }
  }, [timeRange, currentUser, selectedUser, userData]);

  const MetricCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    subtitle = '', 
    comparison = null 
  }: { 
    title: string, 
    value: string | number, 
    icon: React.ReactNode, 
    color: string,
    subtitle?: string,
    comparison?: { 
      value: number, 
      label: string 
    } | null
  }) => (
    <Paper 
      elevation={0} 
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        width: '100%',
        height: '100%',
        borderRadius: 2,
        border: '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 2 } }}>
          <Avatar sx={{ 
            bgcolor: color, 
            color: 'white', 
            mr: 2,
            width: { xs: 32, sm: 40 },
            height: { xs: 32, sm: 40 }
          }}>
            {icon}
          </Avatar>
          <Typography 
            variant="h6" 
            color="text.secondary" 
            fontWeight="medium"
            sx={{
              fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }
            }}
          >
            {title}
          </Typography>
        </Box>
        <Typography 
          variant="h3" 
          component="div" 
          sx={{ 
            fontWeight: 'bold', 
            mt: { xs: 1.5, sm: 2 },
            fontSize: { xs: '1.3rem', sm: '1.7rem', md: '2rem' }
          }}
        >
          {value}
        </Typography>
        {subtitle && (
          <Typography 
            variant="subtitle2" 
            color="text.secondary" 
            sx={{ 
              mt: 1,
              fontSize: { xs: '0.7rem', sm: '0.8rem' }
            }}
          >
            {subtitle}
          </Typography>
        )}
        {comparison && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            <Chip
              icon={<CompareArrowsIcon fontSize="small" />}
              label={`${comparison.value >= 0 ? '+' : ''}${comparison.value.toFixed(1)}% vs ${comparison.label}`}
              color={comparison.value >= 0 ? 'success' : 'error'}
              size="small"
              sx={{
                '& .MuiChip-label': {
                  fontSize: { xs: '0.65rem', sm: '0.75rem' }
                },
                height: { xs: 24, sm: 32 }
              }}
            />
          </Box>
        )}
      </CardContent>
    </Paper>
  );

  const calculateComparison = (current: number, previous: number) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const timeRangeLabels = {
    '30d': 'Últimos 30 dias',
    '90d': 'Últimos 90 dias',
    '180d': 'Últimos 180 dias',
    '365d': 'Último ano',
    'ytd': 'Ano atual',
    'all': 'Todo período'
  };

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100%', 
      px: { xs: 1.5, sm: 4, md: 6 }, 
      py: { xs: 2, sm: 4 },
      boxSizing: 'border-box',
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: { xs: 2, sm: 3 },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1.5, sm: 0 }
      }}>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            fontWeight="bold" 
            color="primary" 
            sx={{ 
              mb: 0,
              fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' }
            }}
          >
            Dashboard
          </Typography>
        </Box>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 1, sm: 2 }} 
          alignItems={{ xs: 'stretch', sm: 'center' }}
          width={{ xs: '100%', sm: 'auto' }}
        >
          {/* Exibir seletor de vendedor apenas para admins */}
          {userData?.role === 'admin' && (
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: { xs: '100%', sm: 200 },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              <InputLabel 
                sx={{ 
                  ...typography.body2,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' }
                }} 
                shrink
              >
                Vendedores
              </InputLabel>
              <Select
                value={selectedUser || ''}
                label="Vendedor"
                onChange={(e) => {
                  // Comentado para melhorar o desempenho
                  // console.log('Selecionando vendedor:', e.target.value);
                  setSelectedUser(e.target.value);
                }}
                displayEmpty
                notched
                sx={{
                  height: { xs: '40px', sm: 'auto' },
                  '& .MuiSelect-select': {
                    ...typography.body2,
                    paddingLeft: '14px',
                    fontSize: { xs: '0.8rem', sm: '0.85rem' }
                  },
                  '& .MuiOutlinedInput-notchedOutline': { 
                    paddingLeft: '14px' 
                  }
                }}
              >
                <MenuItem 
                  value="" 
                  sx={{
                    ...typography.body2,
                    fontSize: { xs: '0.8rem', sm: '0.85rem' }
                  }}
                >
                  Todos
                </MenuItem>
                {users.map((user) => (
                  <MenuItem 
                    key={user.id} 
                    value={user.id} 
                    sx={{
                      ...typography.body2,
                      fontSize: { xs: '0.8rem', sm: '0.85rem' }
                    }}
                  >
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: { xs: '100%', sm: 200 },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            <InputLabel 
              sx={{ 
                ...typography.body2,
                fontSize: { xs: '0.75rem', sm: '0.8rem' }
              }}
            >
              Período
            </InputLabel>
            <Select
              value={timeRange}
              label="Período"
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              sx={{
                height: { xs: '40px', sm: 'auto' },
                '& .MuiSelect-select': {
                  ...typography.body2,
                  fontSize: { xs: '0.8rem', sm: '0.85rem' }
                }
              }}
            >
              {Object.entries(timeRangeLabels).map(([value, label]) => (
                <MenuItem 
                  key={value} 
                  value={value} 
                  sx={{
                    ...typography.body2,
                    fontSize: { xs: '0.8rem', sm: '0.85rem' }
                  }}
                >
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Mostrar comparação com período anterior">
            <IconButton 
              color={showComparison ? 'primary' : 'default'}
              onClick={() => setShowComparison(!showComparison)}
              sx={{ 
                alignSelf: { xs: 'flex-start', sm: 'center' },
                ml: { xs: 0, sm: 1 }
              }}
            >
              <CompareArrowsIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <Typography 
        variant="subtitle1" 
        color="text.secondary" 
        paragraph
        sx={{ 
          display: { 
            xs: 'none', // oculto em mobile
            md: 'block' // visível a partir do breakpoint md (desktop)
          }
        }}
      >
        Bem-vindo ao painel de controle do Cálculo de Orçamentos. Aqui você encontra uma visão geral do seu negócio.
      </Typography>
      <Divider sx={{ my: { xs: 2, sm: 3 } }} />
      
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
        <>
          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: { xs: 0, sm: 1 }, width: '100%', mx: 0 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard 
                title="Clientes" 
                value={metrics.customerCount} 
                icon={<PeopleIcon />}
                color="#1976d2"
                subtitle={`Taxa de Retenção: ${metrics.customerRetention.toFixed(1)}%`}
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
                value={formatCurrency(metrics.totalSales)} 
                icon={<AttachMoneyIcon />}
                color="#ed6c02"
                subtitle={`Crescimento: ${metrics.monthlyGrowth.toFixed(1)}%`}
                comparison={showComparison ? {
                  value: calculateComparison(metrics.totalSales, metrics.previousPeriodSales || 0),
                  label: 'período anterior'
                } : null}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard 
                title="Orçamentos" 
                value={metrics.totalCalculations} 
                icon={<CalculateIcon />}
                color="#9c27b0"
                subtitle={`Ticket Médio: ${formatCurrency(metrics.averageTicket)}`}
                comparison={showComparison ? {
                  value: calculateComparison(
                    metrics.totalCalculations,
                    metrics.previousPeriodCalculations || 0
                  ),
                  label: 'período anterior'
                } : null}
              />
            </Grid>
          </Grid>

          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: { xs: 2, sm: 3 } }}>
            <Grid item xs={12}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: { xs: 2, sm: 3 }, 
                  borderRadius: 2,
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  mb: { xs: 2, sm: 3 },
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' }
                }}>
                  <Typography 
                    variant="h6" 
                    fontWeight="medium"
                    sx={{
                      fontSize: { xs: '1rem', sm: '1.1rem' }
                    }}
                  >
                    Histórico de Vendas
                  </Typography>
                  <Tooltip title="Comparação com o mesmo período do ano anterior">
                    <IconButton 
                      size="small" 
                      sx={{ 
                        ml: { xs: 0, sm: 1 },
                        mt: { xs: 1, sm: 0 }
                      }}
                    >
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ 
                  width: '100%', 
                  height: { xs: 250, sm: 300 } 
                }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={metrics.salesHistory}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <RechartsTooltip 
                        formatter={(value: any) => [formatCurrency(Number(value)), 'Valor']}
                        labelFormatter={(label) => `Data: ${label}`}
                        contentStyle={{ fontSize: '0.8rem' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                      <Line 
                        name="Período Atual"
                        type="monotone" 
                        dataKey="value" 
                        stroke="#1976d2" 
                        strokeWidth={2}
                        dot={{ r: isMobile ? 3 : 4 }}
                        activeDot={{ r: isMobile ? 5 : 6 }}
                      />
                      {showComparison && (
                        <Line 
                          name="Período Anterior"
                          type="monotone" 
                          dataKey="previousValue" 
                          stroke="#9c27b0" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ r: isMobile ? 3 : 4 }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};