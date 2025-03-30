import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  IconButton,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  Tooltip,
  Avatar,
  Grid,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { supabase, Customer, Calculation } from '../lib/supabase';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CalculateIcon from '@mui/icons-material/Calculate';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';

// Estender o tipo jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

type CustomerFormData = {
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  rg?: string;
  endereco_entrega?: string;
  cidade?: string;
  bairro?: string;
  cep?: string;
  data_nascimento?: string;
};

// Estender o tipo Calculation para incluir as propriedades necessárias
type ExtendedCalculation = Calculation & {
  description?: string;
  total_value?: number;
};

export const CustomersPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm<CustomerFormData>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  
  // Estados para o modal de detalhes
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [customerCalculations, setCustomerCalculations] = useState<ExtendedCalculation[]>([]);
  const [loadingCalculations, setLoadingCalculations] = useState(false);

  // Adicionar novos estados para o modal de detalhes do orçamento
  const [calculationDetailsOpen, setCalculationDetailsOpen] = useState(false);
  const [selectedCalculation, setSelectedCalculation] = useState<ExtendedCalculation | null>(null);
  const [calculationAreas, setCalculationAreas] = useState<any[]>([]);
  const [loadingCalculationDetails, setLoadingCalculationDetails] = useState(false);

  // Obter o usuário atual
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user.id);
      }
    };
    
    getCurrentUser();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('customers')
        .select('*');
      
      // Se não for admin, filtrar apenas os clientes do vendedor logado
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser)
        .single();
        
      if (!userError && userData && userData.role !== 'admin' && currentUser) {
        query = query.eq('user_id', currentUser);
      }
        
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customers:', error);
        setError('Falha ao carregar clientes. Por favor, tente novamente mais tarde.');
        return;
      }

      setCustomers(data || []);
    } catch (error) {
      console.error('Error:', error);
      setError('Ocorreu um erro. Por favor, tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchCustomers();
    }
  }, [currentUser]);

  const onSubmit = async (data: CustomerFormData) => {
    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(data)
          .eq('id', editingCustomer.id);

        if (error) throw error;
      } else {
        // Adicionar o user_id ao cadastrar um novo cliente
        const { error } = await supabase
          .from('customers')
          .insert([{ ...data, user_id: currentUser }]);

        if (error) throw error;
      }

      fetchCustomers();
      handleClose();
    } catch (error) {
      console.error('Error saving customer:', error);
      setError('Falha ao salvar cliente. Por favor, tente novamente mais tarde.');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);

    // Preencher o formulário com os dados do cliente
    setValue('name', customer.name);
    setValue('email', customer.email || '');
    setValue('phone', customer.phone || '');
    setValue('cpf', customer.cpf || '');
    setValue('rg', customer.rg || '');
    setValue('endereco_entrega', customer.endereco_entrega || '');
    setValue('cidade', customer.cidade || '');
    setValue('bairro', customer.bairro || '');
    setValue('cep', customer.cep || '');
    setValue('data_nascimento', customer.data_nascimento || '');

    setOpen(true);
  };
  
  // Função para abrir o modal de detalhes e carregar orçamentos
  const handleViewDetails = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailsOpen(true);
    
    try {
      setLoadingCalculations(true);
      const { data, error } = await supabase
        .from('calculations')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) {
        console.error('Error fetching calculations:', error);
        return;
      }
      
      setCustomerCalculations(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingCalculations(false);
    }
  };
  
  // Função para criar um novo orçamento para o cliente
  const handleCreateCalculation = () => {
    if (selectedCustomer) {
      navigate(`/calculations?customer=${selectedCustomer.id}`);
      setDetailsOpen(false);
    }
  };
  
  // Função para ir para a página de detalhes do orçamento - modificada para abrir modal
  const handleViewCalculation = async (calculationId: string) => {
    try {
      setLoadingCalculationDetails(true);
      // Buscar os detalhes completos do orçamento
      const { data, error } = await supabase
        .from('calculations')
        .select('*')
        .eq('id', calculationId)
        .single();
        
      if (error) {
        console.error('Error fetching calculation details:', error);
        return;
      }
      
      if (data) {
        setSelectedCalculation(data);
        
        // Buscar áreas do cálculo, se houver
        const { data: areasData, error: areasError } = await supabase
          .from('calculation_areas')
          .select('*')
          .eq('calculation_id', calculationId);
          
        if (!areasError && areasData) {
          setCalculationAreas(areasData);
        }
        
        setCalculationDetailsOpen(true);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingCalculationDetails(false);
    }
  };

  // Função para fechar o modal de detalhes do orçamento
  const handleCloseCalculationDetails = () => {
    setCalculationDetailsOpen(false);
    setSelectedCalculation(null);
    setCalculationAreas([]);
  };

  // Função para gerar PDF do orçamento atualizada
  const generatePDF = () => {
    if (!selectedCalculation) return;

    const doc = new jsPDF();
    const customer = customers.find(c => c.id === selectedCalculation.customer_id);

    // Configurações iniciais
    doc.setFontSize(20);
    doc.text('Orçamento', 105, 15, { align: 'center' });
    
    // Informações do Cliente
    doc.setFontSize(12);
    doc.text('Informações do Cliente', 14, 30);
    doc.setFontSize(10);
    doc.text(`Cliente: ${customer?.name || 'Não informado'}`, 14, 40);
    doc.text(`Data: ${formatDate(selectedCalculation.created_at)}`, 14, 45);
    
    // Detalhes do Cálculo
    doc.setFontSize(12);
    doc.text('Detalhes do Cálculo', 14, 60);
    doc.setFontSize(10);
    doc.text(`Dimensões da Primeira Área: ${selectedCalculation.vigota_width}m × ${selectedCalculation.vigota_length}m`, 14, 70);
    doc.text(`Área Linear Total: ${safeFormat(selectedCalculation.total_area)} m²`, 14, 75);
    
    // Tabela de Áreas
    if (calculationAreas.length > 0) {
      const tableData = calculationAreas.map((area, index) => [
        `Área ${index + 1}`,
        `${area.vigota_width}m × ${area.vigota_length}m`,
        `${safeFormat(parseFloat(area.vigota_width?.toString() || '0') * parseFloat(area.vigota_length?.toString() || '0') / parseFloat(area.ie?.toString() || '0.5'))} m²`,
        area.ie || '0.5'
      ]);

      autoTable(doc, {
        head: [['Área', 'Dimensões', 'Área Linear', 'IE']],
        body: tableData,
        startY: 85,
        theme: 'grid',
        headStyles: { fillColor: [25, 118, 210] }
      });
    }
    
    // Resumo Financeiro
    const finalY = (doc as any).lastAutoTable?.finalY || 85;
    doc.setFontSize(12);
    doc.text('Resumo Financeiro', 14, finalY + 15);
    doc.setFontSize(10);
    
    const financialData = [
      ['Custos', formatCurrency(parseFloat(selectedCalculation.total_cost?.toString() || '0'))],
      ['Preço da Vigota', formatCurrency(parseFloat(selectedCalculation.vigota_price?.toString() || '0'))],
      ['Preço do EPS', formatCurrency(parseFloat(selectedCalculation.eps_price?.toString() || '0'))],
      ['Custo do Frete', formatCurrency(parseFloat(selectedCalculation.freight_cost?.toString() || '0'))],
      ['Custo por m²', formatCurrency(parseFloat(selectedCalculation.cost_per_m2?.toString() || '0'))]
    ];

    autoTable(doc, {
      body: financialData,
      startY: finalY + 20,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 80 }
      }
    });
    
    // Rodapé
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.text('Documento gerado em ' + new Date().toLocaleDateString('pt-BR'), 14, pageHeight - 10);
    
    // Salvar o PDF
    doc.save(`orcamento_${selectedCalculation.id}_${formatDate(selectedCalculation.created_at)}.pdf`);
  };

  // Função para formatar valores com segurança
  const safeFormat = (value: unknown) => {
    if (value === null || value === undefined) return '0.00';
    if (typeof value === 'number') return value.toFixed(2);
    if (typeof value === 'string') {
      const parsedValue = parseFloat(value);
      return isNaN(parsedValue) ? '0.00' : parsedValue.toFixed(2);
    }
    return '0.00';
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCustomer(null);
    reset();
  };
  
  // Formatar a data para exibição
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };
  
  // Formatar valor para exibição em R$
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  return (
    <Box sx={{
      width: '100%',
      maxWidth: '100%',
      px: { xs: 2, sm: 4, md: 6 },
      py: 4,
      boxSizing: 'border-box',
    }}>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: 4,
        width: '100%'
      }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">
            Clientes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie a base de clientes da sua empresa
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpen(true)}
          startIcon={<AddIcon />}
          sx={{
            borderRadius: 1,
            px: 3,
            py: 1.2,
            textTransform: 'none',
            fontWeight: 'bold',
            mt: { xs: 2, sm: 0 }
          }}
        >
          Novo Cliente
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 2,
          display: 'flex', 
          alignItems: 'center',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 1,
          width: '100%'
        }}
      >
        <TextField
          placeholder="Buscar cliente..."
          variant="outlined"
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: 'white' }}
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ width: '100%', mb: 3, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 1 }}>
        <TableContainer sx={{ width: '100%', overflow: 'auto' }}>
          <Table aria-label="customers table">
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Contato</TableCell>
                <TableCell>Endereço</TableCell>
                <TableCell>Documentos</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : customers.length > 0 ? (
                customers.map((customer) => (
                  <TableRow 
                    key={customer.id}
                    hover
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { 
                        bgcolor: 'rgba(0, 0, 0, 0.04)' 
                      } 
                    }}
                    onClick={() => handleViewDetails(customer)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {customer.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Cliente desde {formatDate(customer.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {customer.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <EmailIcon fontSize="small" color="disabled" sx={{ mr: 1 }} />
                            <Typography variant="body2">{customer.email}</Typography>
                          </Box>
                        )}
                        {customer.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PhoneIcon fontSize="small" color="disabled" sx={{ mr: 1 }} />
                            <Typography variant="body2">{customer.phone}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {customer.endereco_entrega ? customer.endereco_entrega : 'Não informado'}
                      </Typography>
                      {customer.cidade && (
                        <Typography variant="body2" color="text.secondary">
                          {customer.cidade}{customer.bairro ? `, ${customer.bairro}` : ''}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.cpf && (
                        <Typography variant="body2">CPF: {customer.cpf}</Typography>
                      )}
                      {customer.rg && (
                        <Typography variant="body2">RG: {customer.rg}</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar cliente">
                        <IconButton 
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(customer);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Ver detalhes">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(customer);
                          }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      Nenhum cliente encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Modal para cadastro/edição de cliente */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Nome completo"
                  {...register('name')}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  type="email"
                  {...register('email')}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Telefone"
                  {...register('phone')}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="CPF"
                  {...register('cpf')}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="RG"
                  {...register('rg')}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Endereço de entrega"
                  {...register('endereco_entrega')}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Cidade"
                  {...register('cidade')}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Bairro"
                  {...register('bairro')}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="CEP"
                  {...register('cep')}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Data de nascimento"
                  type="date"
                  {...register('data_nascimento')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit(onSubmit)}
          >
            {editingCustomer ? 'Salvar Alterações' : 'Cadastrar Cliente'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modal para visualização de detalhes do cliente */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Detalhes do Cliente
        </DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Grid container spacing={3}>
              {/* Informações do cliente */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mr: 2 }}>
                        {selectedCustomer.name ? selectedCustomer.name.charAt(0).toUpperCase() : 'C'}
                      </Avatar>
                      <Box>
                        <Typography variant="h5" component="div">
                          {selectedCustomer.name}
                        </Typography>
                        <Chip 
                          label={`Cliente desde ${formatDate(selectedCustomer.created_at)}`} 
                          size="small" 
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Informações de Contato
                    </Typography>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">
                        {selectedCustomer.email || 'Não informado'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Telefone
                      </Typography>
                      <Typography variant="body1">
                        {selectedCustomer.phone || 'Não informado'}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Documentos
                    </Typography>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        CPF
                      </Typography>
                      <Typography variant="body1">
                        {selectedCustomer.cpf || 'Não informado'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        RG
                      </Typography>
                      <Typography variant="body1">
                        {selectedCustomer.rg || 'Não informado'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Endereço e informações adicionais */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Endereço
                    </Typography>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body1">
                        {selectedCustomer.endereco_entrega || 'Endereço não informado'}
                      </Typography>
                      {selectedCustomer.cidade && (
                        <Typography variant="body2">
                          {selectedCustomer.cidade}
                          {selectedCustomer.bairro ? `, ${selectedCustomer.bairro}` : ''}
                          {selectedCustomer.cep ? ` - CEP: ${selectedCustomer.cep}` : ''}
                        </Typography>
                      )}
                    </Box>
                    
                    {selectedCustomer.data_nascimento && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Informações Adicionais
                        </Typography>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Data de Nascimento
                          </Typography>
                          <Typography variant="body1">
                            {formatDate(selectedCustomer.data_nascimento)}
                          </Typography>
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
                
                {/* Ações rápidas */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Ações Rápidas
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      startIcon={<CalculateIcon />}
                      onClick={handleCreateCalculation}
                      sx={{ mb: 1 }}
                    >
                      Criar Novo Orçamento
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setDetailsOpen(false);
                        handleEdit(selectedCustomer);
                      }}
                    >
                      Editar Cliente
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Orçamentos recentes */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Orçamentos Recentes
                    </Typography>
                    
                    {loadingCalculations ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                        <CircularProgress size={30} />
                      </Box>
                    ) : customerCalculations.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Data</TableCell>
                              <TableCell>Descrição</TableCell>
                              <TableCell align="right">Valor Total</TableCell>
                              <TableCell align="right">Ações</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {customerCalculations.map((calculation) => (
                              <TableRow key={calculation.id}>
                                <TableCell>{formatDate(calculation.created_at)}</TableCell>
                                <TableCell>{calculation.description || '-'}</TableCell>
                                <TableCell align="right">{formatCurrency(calculation.total_value || 0)}</TableCell>
                                <TableCell align="right">
                                  <IconButton 
                                    size="small" 
                                    color="primary"
                                    onClick={() => handleViewCalculation(calculation.id)}
                                  >
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box sx={{ py: 2, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                          Este cliente ainda não possui orçamentos.
                        </Typography>
                        <Button
                          variant="text"
                          color="primary"
                          startIcon={<CalculateIcon />}
                          onClick={handleCreateCalculation}
                          sx={{ mt: 1 }}
                        >
                          Criar Primeiro Orçamento
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Adicionar o modal de detalhes do orçamento após o modal de detalhes do cliente */}
      {/* Modal para visualização de detalhes do orçamento */}
      <Dialog 
        open={calculationDetailsOpen} 
        onClose={handleCloseCalculationDetails}
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            maxHeight: { xs: '100%', sm: '90vh' },
            overflowY: 'auto'
          }
        }}
      >
        {selectedCalculation ? (
          <>
            <DialogTitle sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(0,0,0,0.08)',
              pb: 2
            }}>
              <Typography variant="h6" component="div" fontWeight="bold">
                Detalhes do Orçamento
              </Typography>
              <IconButton
                edge="end"
                color="inherit"
                onClick={handleCloseCalculationDetails}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 3, px: { xs: 2, sm: 3 } }}>
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        Informações do Cliente
                      </Typography>
                      {selectedCalculation && (
                        <>
                          <Box sx={{ mt: { xs: 1, sm: 2 } }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                              Cliente
                            </Typography>
                            <Typography variant="body1" fontWeight="medium" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                              {customers.find(c => c.id === selectedCalculation.customer_id)?.name || 'Cliente não encontrado'}
                            </Typography>
                          </Box>
                          <Box sx={{ mt: { xs: 1, sm: 2 } }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                              Data do Orçamento
                            </Typography>
                            <Typography variant="body1" fontWeight="medium" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                              {selectedCalculation.created_at ? formatDate(selectedCalculation.created_at) : '-'}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        Detalhes do Cálculo
                      </Typography>
                      {selectedCalculation && (
                        <>
                          <Box sx={{ mt: { xs: 1, sm: 2 } }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                              Dimensões da Primeira Área
                            </Typography>
                            <Typography variant="body1" fontWeight="medium" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                              {selectedCalculation.vigota_width || 0}m × {selectedCalculation.vigota_length || 0}m
                            </Typography>
                          </Box>
                          <Box sx={{ mt: { xs: 1, sm: 2 } }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                              Área Linear Total
                            </Typography>
                            <Typography variant="body1" fontWeight="medium" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                              {safeFormat(selectedCalculation.total_area)} m²
                            </Typography>
                          </Box>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Accordion 
                    elevation={0}
                    sx={{ 
                      border: '1px solid rgba(0,0,0,0.08)',
                      mb: { xs: 1, sm: 2 },
                      '&:before': { display: 'none' },
                      borderRadius: '4px'
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ 
                        backgroundColor: 'rgba(0,0,0,0.02)', 
                        borderRadius: '4px 4px 0 0',
                        py: { xs: 0.5, sm: 1 }
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        Detalhes das Áreas
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ py: { xs: 1, sm: 2 } }}>
                      {selectedCalculation && (
                        <Grid container spacing={2}>
                          {calculationAreas.length > 0 ? (
                            calculationAreas.map((area, index) => (
                              <Grid item xs={12} key={area.id}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                                  {area.name || `Área ${index + 1}`}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: { xs: 0.5, sm: 1 } }}>
                                  <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                    Dimensões: {area.vigota_width || 0}m × {area.vigota_length || 0}m
                                  </Typography>
                                  <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                    Área Linear: {safeFormat(parseFloat(area.vigota_width?.toString() || '0') * parseFloat(area.vigota_length?.toString() || '0') / parseFloat(area.ie?.toString() || '0.5'))} m²
                                  </Typography>
                                </Box>
                                {index < calculationAreas.length - 1 && <Divider sx={{ my: 1 }} />}
                              </Grid>
                            ))
                          ) : (
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                                Área 1 (Principal)
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: { xs: 0.5, sm: 1 } }}>
                                <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                  Dimensões: {selectedCalculation.vigota_width || 0}m × {selectedCalculation.vigota_length || 0}m
                                </Typography>
                                <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                  Área Linear: {safeFormat((selectedCalculation.vigota_width || 0) * (selectedCalculation.vigota_length || 0) / (selectedCalculation.ie || 0.5))} m²
                                </Typography>
                              </Box>
                              <Divider sx={{ my: { xs: 0.5, sm: 1 } }} />
                              <Typography variant="body2" color="text.secondary" sx={{ mt: { xs: 1, sm: 2 }, fontStyle: 'italic', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                Não foram encontradas áreas adicionais para este cálculo.
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      )}
                    </AccordionDetails>
                  </Accordion>
                </Grid>
                
                <Grid item xs={12}>
                  <Card
                    elevation={0}
                    sx={{ 
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderLeft: '4px solid #1976d2',
                      backgroundColor: 'rgba(25, 118, 210, 0.04)'
                    }}
                  >
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Resumo Financeiro
                      </Typography>
                      {selectedCalculation && (
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">
                              Custos
                            </Typography>
                            <Typography variant="body1" fontWeight="medium" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                              {formatCurrency(parseFloat(selectedCalculation.total_cost?.toString() || '0'))}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                              Preço da Vigota
                            </Typography>
                            <Typography variant="body1" fontWeight="medium" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                              {formatCurrency(parseFloat(selectedCalculation.vigota_price?.toString() || '0'))}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                              Preço do EPS
                            </Typography>
                            <Typography variant="body1" fontWeight="medium" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                              {formatCurrency(parseFloat(selectedCalculation.eps_price?.toString() || '0'))}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">
                              Custo do Frete
                            </Typography>
                            <Typography variant="body1" fontWeight="medium" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                              {formatCurrency(parseFloat(selectedCalculation.freight_cost?.toString() || '0'))}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary" fontWeight="bold">
                              Custo por m²
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="primary" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                              {formatCurrency(parseFloat(selectedCalculation.cost_per_m2?.toString() || '0'))}
                            </Typography>
                          </Grid>
                        </Grid>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 }, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              <Button 
                onClick={handleCloseCalculationDetails} 
                color="inherit"
                size="small"
                sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
              >
                Fechar
              </Button>
              <Button 
                onClick={() => {
                  handleCloseCalculationDetails();
                  navigate(`/calculations?id=${selectedCalculation.id}`);
                }}
                color="primary"
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
              >
                Editar
              </Button>
              <Button 
                onClick={generatePDF} 
                variant="contained" 
                color="primary"
                size="small"
                startIcon={<PictureAsPdfIcon />}
                sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
              >
                Gerar PDF
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
    </Box>
  );
};