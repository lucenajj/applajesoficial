import { AppBar, Toolbar, Typography, Button, Box, IconButton, useMediaQuery, useTheme, Drawer, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import CalculateIcon from '@mui/icons-material/Calculate';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { name: 'Home', path: '/', icon: <HomeIcon /> },
    { name: 'Clientes', path: '/customers', icon: <PeopleIcon /> },
    { name: 'Produtos', path: '/products', icon: <InventoryIcon /> },
    { name: 'Cálculos', path: '/calculations', icon: <CalculateIcon /> },
    { name: 'Usuários', path: '/users', icon: <PersonIcon /> },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error);
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          AppLajes
        </Typography>
      </Box>
      <List>
        {navItems.map((item) => (
          <ListItem 
            button 
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
              }
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.name} />
          </ListItem>
        ))}
        <ListItem button onClick={handleLogout}>
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
      sx={{ 
        borderBottom: '1px solid rgba(0,0,0,0.08)', 
        width: '100%',
        maxWidth: '100%' 
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