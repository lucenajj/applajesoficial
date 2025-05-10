import { AppBar, Toolbar, Typography, Button, Box, IconButton, useMediaQuery, useTheme, Drawer, List, ListItem, ListItemText, ListItemIcon, Menu, MenuItem, Collapse } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import CalculateIcon from '@mui/icons-material/Calculate';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [productsMenuOpen, setProductsMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Obter o role do usuário logado
  useEffect(() => {
    const getUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Buscar o role do usuário na tabela 'users'
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (!error && data) {
          setUserRole(data.role);
        }
      }
    };
    
    getUserRole();
  }, []);

  // Definir os itens de navegação com base no role
  const getNavItems = () => {
    const baseItems = [
      { name: 'Home', path: '/', icon: <HomeIcon /> },
      { name: 'Clientes', path: '/customers', icon: <PeopleIcon /> },
      { name: 'Cálculos', path: '/calculations', icon: <CalculateIcon /> },
    ];
    
    // Adicionar menus que só administradores devem acessar
    if (userRole === 'admin') {
      return [
        ...baseItems,
        { 
          name: 'Produtos', 
          path: '/products', 
          icon: <InventoryIcon />,
          hasSubmenu: true,
          submenu: [
            { name: 'Vigotas', path: '/products/vigotas' },
            { name: 'Eps', path: '/products/eps' },
            { name: 'Capa', path: '/products/capa' }
          ] 
        },
        { name: 'Usuários', path: '/users', icon: <PersonIcon /> }
      ];
    }
    
    return baseItems;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
    setAnchorEl(null); // Fechar dropdown se estiver aberto
  };

  const handleProductsMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!isMobile) {
      setAnchorEl(event.currentTarget);
    } else {
      setProductsMenuOpen(!productsMenuOpen);
    }
  };

  const handleProductsMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error);
    navigate('/login');
  };

  const navItems = getNavItems();

  const isProductsPath = location.pathname.startsWith('/products');

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          AppLajes
        </Typography>
      </Box>
      <List>
        {navItems.map((item) => (
          item.hasSubmenu ? (
            <Box key={item.name}>
              <ListItem 
                onClick={handleProductsMenuClick}
                selected={isProductsPath}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(25, 118, 210, 0.12)',
                    borderLeft: '4px solid #1976d2',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.18)',
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                  cursor: 'pointer'
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.name} />
                {productsMenuOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </ListItem>
              <Collapse in={productsMenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.submenu?.map((submenuItem) => (
                    <ListItem
                      key={submenuItem.name}
                      onClick={() => handleNavigation(submenuItem.path)}
                      selected={location.pathname === submenuItem.path}
                      sx={{
                        pl: 4,
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(25, 118, 210, 0.08)',
                          borderLeft: '4px solid #1976d2',
                          '&:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.12)',
                          }
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                        cursor: 'pointer'
                      }}
                    >
                      <ListItemText primary={submenuItem.name} />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          ) : (
            <ListItem 
              key={item.name}
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(25, 118, 210, 0.12)',
                  borderLeft: '4px solid #1976d2',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.18)',
                  }
                },
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
                cursor: 'pointer'
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItem>
          )
        ))}
        <ListItem 
          onClick={handleLogout}
          sx={{ cursor: 'pointer' }}
        >
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      color="primary"
      sx={{ 
        borderBottom: '1px solid rgba(0,0,0,0.08)', 
        width: '100%',
        maxWidth: '100%',
        bgcolor: '#224080',
      }}
    >
      <Toolbar sx={{ 
        px: { xs: 2, sm: 4, md: 6 }, 
        width: '100%', 
        maxWidth: '100%', 
        boxSizing: 'border-box',
      }}>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1, 
            fontWeight: 'bold',
            fontSize: { xs: '1.2rem', md: '1.5rem' }
          }}
        >
          App Calculo de Orçamentos
        </Typography>
        
        {isMobile ? (
          <>
            <IconButton 
              color="inherit" 
              edge="end" 
              onClick={() => setDrawerOpen(true)}
              aria-label="menu"
            >
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
            >
              {drawer}
            </Drawer>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {navItems.map((item) => (
              item.hasSubmenu ? (
                <Box key={item.name}>
                  <Button 
                    color="inherit" 
                    onClick={handleProductsMenuClick}
                    sx={{ 
                      mx: 1, 
                      py: 1,
                      px: 2,
                      borderRadius: 1,
                      textTransform: 'none',
                      fontWeight: isProductsPath ? 'bold' : 'normal',
                      backgroundColor: isProductsPath ? 'rgba(255,255,255,0.1)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.2)'
                      }
                    }}
                    startIcon={item.icon}
                    endIcon={anchorEl ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  >
                    {item.name}
                  </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleProductsMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
                  >
                    {item.submenu?.map((submenuItem) => (
                      <MenuItem 
                        key={submenuItem.name} 
                        onClick={() => handleNavigation(submenuItem.path)}
                        selected={location.pathname === submenuItem.path}
                      >
                        {submenuItem.name}
                      </MenuItem>
                    ))}
                  </Menu>
                </Box>
              ) : (
                <Button 
                  key={item.name}
                  color="inherit" 
                  onClick={() => handleNavigation(item.path)}
                  sx={{ 
                    mx: 1, 
                    py: 1,
                    px: 2,
                    borderRadius: 1,
                    textTransform: 'none',
                    fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                    backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.2)'
                    }
                  }}
                  startIcon={item.icon}
                >
                  {item.name}
                </Button>
              )
            ))}
            <Button 
              color="inherit" 
              onClick={handleLogout}
              sx={{ 
                mx: 1, 
                py: 1,
                px: 2,
                borderRadius: 1,
                textTransform: 'none',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)'
                }
              }}
              startIcon={<LogoutIcon />}
            >
              Logout
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};