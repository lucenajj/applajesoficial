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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  IconButton,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  Grid
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { supabase, Product } from '../lib/supabase';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

type ProductFormData = {
  name: string;
  type: 'forro' | 'piso' | '';
  venda: number | string;
  fios: number | string;
  carga: number | string;
  ht: number | string;
  minimo: number | string;
  maximo: number | string;
  custo: number | string;
  margem: number | string;
  description?: string;
};

export const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { control, handleSubmit, reset, setValue } = useForm<ProductFormData>({
    defaultValues: {
      name: '',
      type: '',
      venda: '',
      fios: '',
      carga: '',
      ht: '',
      minimo: '',
      maximo: '',
      custo: '',
      margem: '',
      description: '',
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      setError('Falha ao carregar produtos. Por favor, tente novamente mais tarde.');
      return;
    }

    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditMode(true);
    
    setValue('name', product.name);
    setValue('type', product.type);
    setValue('venda', product.venda);
    setValue('fios', product.fios);
    setValue('carga', product.carga);
    setValue('ht', product.ht);
    setValue('minimo', product.minimo);
    setValue('maximo', product.maximo);
    setValue('custo', product.custo);
    setValue('margem', product.margem);
    setValue('description', product.description || '');
    
    setOpen(true);
  };

  const handleDeleteProduct = (product: Product, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', selectedProduct.id);

    if (error) {
      console.error('Error deleting product:', error);
      setError('Falha ao excluir produto. Por favor, tente novamente mais tarde.');
      return;
    }

    setDeleteDialogOpen(false);
    setSelectedProduct(null);
    fetchProducts();
  };

  const onSubmit = async (data: ProductFormData) => {
    // Verificar se type está vazio e definir um valor padrão
    if (data.type === '') {
      data.type = 'forro'; // Define forro como valor padrão se estiver vazio
    }

    // Função para normalizar valores numéricos (substituir vírgula por ponto)
    const normalizeNumber = (value: any): number | undefined => {
      if (value === undefined || value === null || value === '') return undefined;
      
      // Converte para string para garantir que podemos manipular o valor
      let normalizedValue = String(value);
      
      // Substitui todas as vírgulas por pontos para garantir formato numérico correto
      normalizedValue = normalizedValue.replace(/,/g, '.');
      
      // Verifica se é um número válido
      const parsedValue = parseFloat(normalizedValue);
      return isNaN(parsedValue) ? undefined : parsedValue;
    };

    // Função para formatar com precisão específica
    const formatDecimal = (value: number | undefined, decimals: number): number | undefined => {
      if (value === undefined) return undefined;
      const factor = Math.pow(10, decimals);
      // Arredonda para evitar problemas de precisão de ponto flutuante
      return Math.round(value * factor) / factor;
    };

    // Tenta todas as opções possíveis para o tipo baseado nas migrações
    const getValidTypeValue = (selectedType: string) => {
      // Primeira opção: tipos na migração 20250404_fix_product_type_constraint.sql
      if (selectedType === 'forro' || selectedType === 'piso') {
        return selectedType;
      }
      
      // Segunda opção: tipos na migração 20250401_update_products_table.sql
      const typeMapping: Record<string, string> = {
        'forro': 'vigota', // Mapeia forro para vigota (valor aceito na migração original)
        'piso': 'outro',   // Mapeia piso para outro
        '': 'vigota'       // Valor padrão
      };
      
      return typeMapping[selectedType] || 'vigota';
    };

    // Garantir que todos os valores sejam formatados corretamente
    const formattedData = {
      ...data,
      // Tenta determinar o tipo correto para o banco de dados
      type: getValidTypeValue(data.type),
      // Valores com 3 casas decimais
      venda: formatDecimal(normalizeNumber(data.venda), 3) || 0,
      minimo: formatDecimal(normalizeNumber(data.minimo), 3) || 0,
      maximo: formatDecimal(normalizeNumber(data.maximo), 3) || 0,
      custo: formatDecimal(normalizeNumber(data.custo), 3) || 0,
      // Outros valores
      fios: normalizeNumber(data.fios) !== undefined ? Math.round(normalizeNumber(data.fios)!) : 0, // fios é INTEGER
      carga: formatDecimal(normalizeNumber(data.carga), 3) || 0,
      ht: formatDecimal(normalizeNumber(data.ht), 3) || 0,
      margem: formatDecimal(normalizeNumber(data.margem), 3) || 0
    };

    console.log('Dados formatados para envio:', formattedData);

    if (editMode && selectedProduct) {
      const { error } = await supabase
        .from('products')
        .update(formattedData)
        .eq('id', selectedProduct.id);

      if (error) {
        console.error('Error updating product:', error);
        setError('Falha ao atualizar produto. Por favor, tente novamente mais tarde.');
        return;
      }
    } else {
      const { error } = await supabase.from('products').insert([formattedData]);

      if (error) {
        console.error('Error creating product:', error);
        setError(`Falha ao criar produto: ${error.message}`);
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
      name: '',
      type: '',
      venda: '',
      fios: '',
      carga: '',
      ht: '',
      minimo: '',
      maximo: '',
      custo: '',
      margem: '',
      description: '',
    });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditMode(false);
    setSelectedProduct(null);
    reset({
      name: '',
      type: '',
      venda: '',
      fios: '',
      carga: '',
      ht: '',
      minimo: '',
      maximo: '',
      custo: '',
      margem: '',
      description: '',
    });
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
            Produtos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie os produtos utilizados nos orçamentos
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenDialog}
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
          Novo Produto
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : (
        <TableContainer 
          component={Paper} 
          elevation={0}
          sx={{ 
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 1,
            width: '100%',
            overflowX: 'auto'
          }}
        >
          <Table>
            <TableHead sx={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fios</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Carga</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>HT</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Mínimo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Máximo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>R$ Custo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>% Marg</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>R$ Venda</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Descrição</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow 
                  key={product.id} 
                  hover
                  onClick={() => handleEditProduct(product)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.fios}</TableCell>
                  <TableCell>
                    <Chip 
                      label={product.type === 'forro' ? 'Forro' : 'Piso'} 
                      size="small"
                      color={product.type === 'forro' ? 'primary' : 'secondary'}
                      variant="outlined"
                      sx={{ 
                        borderRadius: 1,
                        textTransform: 'capitalize'
                      }}
                    />
                  </TableCell>
                  <TableCell>{product.carga !== null && product.carga !== undefined ? product.carga.toFixed(3) : '0.000'}</TableCell>
                  <TableCell>{product.ht !== null && product.ht !== undefined ? product.ht.toFixed(3) : '0.000'}</TableCell>
                  <TableCell>{product.minimo !== null && product.minimo !== undefined ? product.minimo.toFixed(3) : '0.000'}</TableCell>
                  <TableCell>{product.maximo !== null && product.maximo !== undefined ? product.maximo.toFixed(3) : '0.000'}</TableCell>
                  <TableCell>R$ {product.custo !== null && product.custo !== undefined ? product.custo.toFixed(3) : '0.000'}</TableCell>
                  <TableCell>{product.margem !== null && product.margem !== undefined ? product.margem.toFixed(3) : '0.000'}%</TableCell>
                  <TableCell>R$ {product.venda !== null && product.venda !== undefined ? product.venda.toFixed(3) : '0.000'}</TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell align="center">
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProduct(product);
                      }}
                      sx={{ 
                        mr: 1,
                        '&:hover': { 
                          backgroundColor: 'rgba(25, 118, 210, 0.04)' 
                        } 
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={(e) => handleDeleteProduct(product, e)}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'rgba(211, 47, 47, 0.04)' 
                        } 
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog 
        open={open} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          elevation: 10,
          sx: { borderRadius: 2 }
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h6" component="div" fontWeight="bold">
              {editMode ? "Editar Produto" : "Novo Produto"}
            </Typography>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Nome"
                      fullWidth
                      required
                      variant="outlined"
                      InputProps={{
                        sx: { borderRadius: 1 }
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth required>
                      <InputLabel>Tipo</InputLabel>
                      <Select
                        {...field}
                        label="Tipo"
                        sx={{ borderRadius: 1 }}
                      >
                        <MenuItem value="forro">Forro</MenuItem>
                        <MenuItem value="piso">Piso</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="fios"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Fios"
                      fullWidth
                      type="number"
                      variant="outlined"
                      InputProps={{
                        sx: { borderRadius: 1 }
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Controller
                  name="carga"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Carga"
                      fullWidth
                      type="number"
                      inputProps={{ 
                        step: "0.001",
                        onInput: (e) => {
                          // Permite vírgula como separador decimal no input
                          const target = e.target as HTMLInputElement;
                          target.value = target.value.replace(',', '.');
                        }
                      }}
                      variant="outlined"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">kg/m²</InputAdornment>,
                        sx: { borderRadius: 1 }
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Controller
                  name="ht"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="HT"
                      fullWidth
                      type="number"
                      inputProps={{ 
                        step: "0.001",
                        onInput: (e) => {
                          // Permite vírgula como separador decimal no input
                          const target = e.target as HTMLInputElement;
                          target.value = target.value.replace(',', '.');
                        }
                      }}
                      variant="outlined"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                        sx: { borderRadius: 1 }
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Controller
                  name="margem"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Margem"
                      fullWidth
                      type="number"
                      inputProps={{ 
                        step: "0.001",
                        onInput: (e) => {
                          // Permite vírgula como separador decimal no input
                          const target = e.target as HTMLInputElement;
                          target.value = target.value.replace(',', '.');
                        }
                      }}
                      variant="outlined"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        sx: { borderRadius: 1 }
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Controller
                  name="minimo"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Mínimo"
                      fullWidth
                      type="text"
                      value={typeof field.value === 'number' ? field.value.toFixed(3).replace('.', ',') : field.value}
                      onChange={(e) => {
                        // Permite apenas dígitos, vírgula e ponto
                        const value = e.target.value.replace(/[^\d.,]/g, '');
                        // Substitui ponto por vírgula para manter consistência na UI
                        field.onChange(value.replace('.', ','));
                      }}
                      variant="outlined"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                        sx: { borderRadius: 1 }
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Controller
                  name="maximo"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Máximo"
                      fullWidth
                      type="text"
                      value={typeof field.value === 'number' ? field.value.toFixed(3).replace('.', ',') : field.value}
                      onChange={(e) => {
                        // Permite apenas dígitos, vírgula e ponto
                        const value = e.target.value.replace(/[^\d.,]/g, '');
                        // Substitui ponto por vírgula para manter consistência na UI
                        field.onChange(value.replace('.', ','));
                      }}
                      variant="outlined"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                        sx: { borderRadius: 1 }
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Controller
                  name="custo"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Custo"
                      fullWidth
                      type="text"
                      value={typeof field.value === 'number' ? field.value.toFixed(3).replace('.', ',') : field.value}
                      onChange={(e) => {
                        // Permite apenas dígitos, vírgula e ponto
                        const value = e.target.value.replace(/[^\d.,]/g, '');
                        // Substitui ponto por vírgula para manter consistência na UI
                        field.onChange(value.replace('.', ','));
                      }}
                      variant="outlined"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                        sx: { borderRadius: 1 }
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Controller
                  name="venda"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Valor de Venda"
                      fullWidth
                      required
                      type="text"
                      value={typeof field.value === 'number' ? field.value.toFixed(3).replace('.', ',') : field.value}
                      onChange={(e) => {
                        // Permite apenas dígitos, vírgula e ponto
                        const value = e.target.value.replace(/[^\d.,]/g, '');
                        // Substitui ponto por vírgula para manter consistência na UI
                        field.onChange(value.replace('.', ','));
                      }}
                      variant="outlined"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                        sx: { borderRadius: 1 }
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value || ''}
                      label="Descrição"
                      fullWidth
                      multiline
                      rows={3}
                      variant="outlined"
                      InputProps={{
                        sx: { borderRadius: 1 }
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={handleCloseDialog}
              variant="outlined"
              sx={{ 
                borderRadius: 1,
                px: 3,
                textTransform: 'none'
              }}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              sx={{ 
                borderRadius: 1,
                px: 3,
                textTransform: 'none',
                fontWeight: 'bold'
              }}
            >
              Salvar
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Tem certeza que deseja excluir o produto "{selectedProduct?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            color="primary"
          >
            Cancelar
          </Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};