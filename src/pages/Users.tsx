import { useState, useEffect } from 'react';
import {
  Box,
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
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  Modal,
  DialogContentText
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

type UserFormData = {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'seller';
};

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at?: string;
}

export const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const { control, handleSubmit, reset, setValue } = useForm<UserFormData>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      setError('Falha ao carregar usuários. Por favor, tente novamente mais tarde.');
      return;
    }

    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmit = async (data: UserFormData) => {
    try {
      if (editingUser) {
        // Atualizar usuário existente
        const { error: updateError } = await supabase
          .from('users')
          .update({
            name: data.name,
            role: data.role
          })
          .eq('id', editingUser.id);

        if (updateError) throw updateError;
        
        setEditingUser(null);
      } else {
        // Criar novo usuário
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });

        if (authError) throw authError;

        if (!authData.user) throw new Error('Falha ao obter ID do usuário.');

        const { error: insertError } = await supabase.from('users').insert([{
          id: authData.user.id,
          email: data.email,
          name: data.name,
          role: data.role,
        }]);

        if (insertError) throw insertError;
      }

      setOpen(false);
      reset();
      fetchUsers();
    } catch (err) {
      console.error('Error saving user:', err);
      setError(`Falha ao ${editingUser ? 'atualizar' : 'criar'} usuário. Por favor, tente novamente mais tarde.`);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingUser(null);
    reset();
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    
    // Preencher formulário com dados do usuário
    setValue('name', user.name);
    setValue('email', user.email);
    setValue('role', user.role as 'admin' | 'seller');
    
    setOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    try {
      // Excluir usuário do banco de dados
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userToDelete.id);

      if (error) throw error;
      
      // Atualizar lista
      fetchUsers();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Falha ao excluir usuário. Por favor, tente novamente mais tarde.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  // Renderiza o formulário de usuário
  const renderUserForm = () => (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
        height: '100%'
      }}>
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
        }}>
          <Typography variant="h6" component="div" fontWeight="bold">
            {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
          </Typography>
          {isMobile && (
            <IconButton onClick={handleClose} edge="end" aria-label="fechar">
              <CloseIcon />
            </IconButton>
          )}
        </Box>

        <Box sx={{ 
          p: 3, 
          flex: 1,
          overflowY: 'auto'
        }}>
          <Controller
            name="name"
            control={control}
            defaultValue=""
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
            name="email"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                required
                variant="outlined"
                disabled={!!editingUser}
                InputProps={{
                  sx: { borderRadius: 1 }
                }}
              />
            )}
          />
          {!editingUser && (
            <Controller
              name="password"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Senha"
                  type="password"
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
          )}
          <Controller
            name="role"
            control={control}
            defaultValue="seller"
            render={({ field }) => (
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Função</InputLabel>
                <Select
                  {...field}
                  label="Função"
                  sx={{ borderRadius: 1 }}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="seller">Vendedor</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Box>

        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'flex-end',
          gap: 2,
          borderTop: '1px solid rgba(0, 0, 0, 0.12)',
          backgroundColor: 'rgba(0, 0, 0, 0.02)'
        }}>
          <Button 
            onClick={handleClose}
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
        </Box>
      </Box>
    </form>
  );

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
            Usuários
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie os usuários do sistema
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
          Novo Usuário
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
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Função</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow 
                  key={user.id}
                  hover
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: 'rgba(25, 118, 210, 0.04)'
                    }
                  }}
                >
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title="Editar">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleEdit(user)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteClick(user)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {isMobile ? (
        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="modal-user-title"
          disableAutoFocus
          disableEnforceFocus
          disableRestoreFocus
          keepMounted={false}
          container={() => document.getElementById('modal-root')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1400
          }}
          BackdropProps={{
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }
          }}
        >
          <Box sx={{
            width: '100%',
            height: '100%',
            bgcolor: 'background.paper',
            outline: 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}>
            {renderUserForm()}
          </Box>
        </Modal>
      ) : (
        <Dialog 
          open={open} 
          onClose={handleClose}
          fullWidth
          maxWidth="sm"
          container={() => document.getElementById('modal-root')}
          PaperProps={{
            elevation: 10,
            sx: { 
              borderRadius: 2,
              margin: 2,
              overflow: 'hidden'
            }
          }}
        >
          {renderUserForm()}
        </Dialog>
      )}

      {/* Diálogo de confirmação de exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        PaperProps={{
          elevation: 8,
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="div" fontWeight="bold">
            Excluir Usuário
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o usuário <strong>{userToDelete?.name}</strong>?
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleDeleteCancel}
            variant="outlined"
            sx={{ 
              borderRadius: 1,
              textTransform: 'none'
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            variant="contained" 
            color="error"
            sx={{ 
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 'bold'
            }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 