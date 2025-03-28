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
  InputAdornment
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { supabase, Product } from '../lib/supabase';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

type ProductFormData = {
  name: string;
  type: 'vigota' | 'eps' | undefined;
  price: number | undefined;
  description?: string;
};

export const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { control, handleSubmit, reset, setValue } = useForm<ProductFormData>();
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
    setValue('price', product.price);
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
    // Garantir que o preço tenha 3 casas decimais
    const formattedData = {
      ...data,
      // Primeiro converter para número e depois aplicar o toFixed
      price: data.price !== undefined ? parseFloat(Number(data.price).toFixed(3)) : undefined
    };

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
        setError('Falha ao criar produto. Por favor, tente novamente mais tarde.');
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
    reset();
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditMode(false);
    setSelectedProduct(null);
    reset();
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
            width: '100%'
          }}
        >
          <Table>
            <TableHead sx={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Preço</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Descrição</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow 
                  key={product.id}
                  hover
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: 'rgba(25, 118, 210, 0.04)'
                    }
                  }}
                >
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={product.type === 'vigota' ? 'Vigota' : 'EPS'} 
                      size="small"
                      color={product.type === 'vigota' ? 'primary' : 'secondary'}
                      variant="outlined"
                      sx={{ 
                        borderRadius: 1,
                        textTransform: 'capitalize'
                      }}
                    />
                  </TableCell>
                  <TableCell>R$ {product.price !== undefined && product.price !== null ? Number(product.price).toFixed(3) : '0.000'}</TableCell>
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
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nome"
                  fullWidth
                  margin="normal"
                  required
                  variant="outlined"
                  InputProps={{
                    sx: { borderRadius: 1 }
                  }}
                />
              )}
            />
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    {...field}
                    label="Tipo"
                    sx={{ borderRadius: 1 }}
                  >
                    <MenuItem value="vigota">Vigota</MenuItem>
                    <MenuItem value="eps">EPS</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Preço"
                  fullWidth
                  margin="normal"
                  required
                  type="number"
                  inputProps={{ step: "0.001" }}
                  variant="outlined"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    sx: { borderRadius: 1 }
                  }}
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Descrição"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={3}
                  variant="outlined"
                  InputProps={{
                    sx: { borderRadius: 1 }
                  }}
                />
              )}
            />
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