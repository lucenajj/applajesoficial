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
  FormControl,
  Box,
  IconButton,
  Alert,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { supabase, EPS } from '../lib/supabase';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

type EPSFormData = {
  nome: string;
  tipo: string;
  dimensoes: string;
  custo: number | string;
  margem: number | string;
  venda: number | string;
};

export const EPSProductsPage = () => {
  const [products, setProducts] = useState<EPS[]>([]);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<EPS | null>(null);
  const { control, handleSubmit, reset, setValue, watch } = useForm<EPSFormData>({
    defaultValues: {
      nome: '',
      tipo: '',
      dimensoes: '',
      custo: '',
      margem: '',
      venda: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Observar mudanças no custo e na margem para calcular o preço de venda automaticamente
  const custoValue = watch('custo');
  const margemValue = watch('margem');

  useEffect(() => {
    if (custoValue && margemValue) {
      const custo = parseFloat(String(custoValue).replace(',', '.'));
      const margem = parseFloat(String(margemValue).replace(',', '.'));
      
      if (!isNaN(custo) && !isNaN(margem)) {
        const venda = custo * (1 + margem / 100);
        setValue('venda', venda.toFixed(2));
      }
    }
  }, [custoValue, margemValue, setValue]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('eps_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching EPS products:', error);
      setError('Falha ao carregar produtos EPS. Por favor, tente novamente mais tarde.');
      return;
    }

    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEditProduct = (product: EPS) => {
    setSelectedProduct(product);
    setEditMode(true);
    
    setValue('nome', product.nome);
    setValue('tipo', product.tipo);
    setValue('dimensoes', product.dimensoes);
    setValue('custo', product.custo);
    setValue('margem', product.margem);
    setValue('venda', product.venda);
    
    setOpen(true);
  };

  const handleDeleteProduct = (product: EPS, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;
    
    const { error } = await supabase
      .from('eps_products')
      .delete()
      .eq('id', selectedProduct.id);

    if (error) {
      console.error('Error deleting EPS product:', error);
      setError('Falha ao excluir produto EPS. Por favor, tente novamente mais tarde.');
      return;
    }

    setDeleteDialogOpen(false);
    setSelectedProduct(null);
    fetchProducts();
  };

  const onSubmit = async (data: EPSFormData) => {
    // Função para normalizar valores numéricos (substituir vírgula por ponto)
    const normalizeNumber = (value: any): number => {
      if (value === undefined || value === null || value === '') return 0;
      
      // Converte para string para garantir que podemos manipular o valor
      let normalizedValue = String(value);
      
      // Substitui todas as vírgulas por pontos para garantir formato numérico correto
      normalizedValue = normalizedValue.replace(/,/g, '.');
      
      // Verifica se é um número válido
      const parsedValue = parseFloat(normalizedValue);
      return isNaN(parsedValue) ? 0 : parsedValue;
    };

    // Garantir que todos os valores sejam formatados corretamente
    const formattedData = {
      nome: data.nome,
      tipo: data.tipo,
      dimensoes: data.dimensoes,
      custo: normalizeNumber(data.custo),
      margem: normalizeNumber(data.margem),
      venda: normalizeNumber(data.venda)
    };

    if (editMode && selectedProduct) {
      const { error } = await supabase
        .from('eps_products')
        .update(formattedData)
        .eq('id', selectedProduct.id);

      if (error) {
        console.error('Error updating EPS product:', error);
        setError('Falha ao atualizar produto EPS. Por favor, tente novamente mais tarde.');
        return;
      }
    } else {
      const { error } = await supabase.from('eps_products').insert([formattedData]);

      if (error) {
        console.error('Error creating EPS product:', error);
        setError(`Falha ao criar produto EPS: ${error.message}`);
        return;
      }
    }

    setOpen(false);
    setEditMode(false);
    setSelectedProduct(null);
    reset();
    fetchProducts();
  };

  const handleOpenDialog = () => {
    setEditMode(false);
    setSelectedProduct(null);
    reset({
      nome: '',
      tipo: '',
      dimensoes: '',
      custo: '',
      margem: '',
      venda: ''
    });
    setOpen(true);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Produtos EPS
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Novo Produto
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 4, maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
          <Table stickyHeader aria-label="produtos eps table">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Dimensões</TableCell>
                <TableCell>R$ Custo</TableCell>
                <TableCell>% Margem</TableCell>
                <TableCell>R$ Venda</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" color="textSecondary" py={2}>
                      Nenhum produto EPS cadastrado
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow 
                    key={product.id}
                    hover
                    onClick={() => handleEditProduct(product)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{product.nome}</TableCell>
                    <TableCell>{product.tipo}</TableCell>
                    <TableCell>{product.dimensoes}</TableCell>
                    <TableCell>R$ {product.custo.toFixed(2)}</TableCell>
                    <TableCell>{product.margem.toFixed(2)}%</TableCell>
                    <TableCell>R$ {product.venda.toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProduct(product);
                        }}
                      >
                        <EditIcon fontSize="small" color="primary" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={(e) => handleDeleteProduct(product, e)}
                      >
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog para adicionar/editar produto */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{editMode ? 'Editar Produto EPS' : 'Novo Produto EPS'}</DialogTitle>
          <DialogContent dividers>
            <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={2}>
              <Box gridColumn="span 8">
                <Controller
                  name="nome"
                  control={control}
                  rules={{ required: "Nome é obrigatório" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Nome"
                      fullWidth
                      margin="normal"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Box>

              <Box gridColumn="span 4">
                <Controller
                  name="tipo"
                  control={control}
                  rules={{ required: "Tipo é obrigatório" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Tipo"
                      fullWidth
                      margin="normal"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Box>

              <Box gridColumn="span 12">
                <Controller
                  name="dimensoes"
                  control={control}
                  rules={{ required: "Dimensões são obrigatórias" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Dimensões"
                      fullWidth
                      margin="normal"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Box>

              <Box gridColumn="span 4">
                <Controller
                  name="custo"
                  control={control}
                  rules={{ required: "Custo é obrigatório" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Custo"
                      fullWidth
                      margin="normal"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                      }}
                    />
                  )}
                />
              </Box>

              <Box gridColumn="span 4">
                <Controller
                  name="margem"
                  control={control}
                  rules={{ required: "Margem é obrigatória" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Margem"
                      fullWidth
                      margin="normal"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                    />
                  )}
                />
              </Box>

              <Box gridColumn="span 4">
                <Controller
                  name="venda"
                  control={control}
                  rules={{ required: "Preço de venda é obrigatório" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Preço de Venda"
                      fullWidth
                      margin="normal"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                      }}
                    />
                  )}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="primary">
              {editMode ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog de confirmação para excluir */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o produto "{selectedProduct?.nome}"? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}; 