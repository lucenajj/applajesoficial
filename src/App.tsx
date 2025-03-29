import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ThemeProvider, CssBaseline, Box, StyledEngineProvider } from '@mui/material';
import { Navigation } from './components/Navigation';
import { theme } from './theme'; // Importando o tema atualizado
import { CustomersPage } from './pages/Customers';
import { ProductsPage } from './pages/Products';
import { CalculationsPage } from './pages/Calculations';
import { LoginPage } from './pages/Login';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { HomePage } from './pages/Home';
import { UsersPage } from './pages/Users';
import './App.css';

// Componente para remover o aria-hidden do root quando um modal estiver aberto
const AriaHiddenFix = () => {
  useEffect(() => {
    // Função para remover o aria-hidden do root
    const removeAriaHidden = () => {
      const rootElement = document.getElementById('root');
      if (rootElement && rootElement.getAttribute('aria-hidden') === 'true') {
        rootElement.removeAttribute('aria-hidden');
      }
    };

    // Observar mudanças no DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
          removeAriaHidden();
        }
      });
    });

    const rootElement = document.getElementById('root');
    if (rootElement) {
      observer.observe(rootElement, { attributes: true });
      removeAriaHidden(); // Remover aria-hidden inicialmente
    }

    // Adicionar um ouvinte para quando um modal for aberto
    const handleModalOpen = () => {
      setTimeout(removeAriaHidden, 0);
    };

    document.addEventListener('mousedown', handleModalOpen);
    document.addEventListener('keydown', handleModalOpen);
    document.addEventListener('focusin', handleModalOpen);

    return () => {
      observer.disconnect();
      document.removeEventListener('mousedown', handleModalOpen);
      document.removeEventListener('keydown', handleModalOpen);
      document.removeEventListener('focusin', handleModalOpen);
    };
  }, []);

  return null;
};

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AriaHiddenFix />
        <Router>
          {!session ? (
            // Login page without Navigation and with full screen layout
            <Routes>
              <Route path="*" element={<LoginPage />} />
            </Routes>
          ) : (
            // App with Navigation for authenticated users
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              height: '100vh', 
              width: '100vw', 
              maxWidth: '100%',
              overflow: 'hidden'
            }}>
              <Navigation />
              <Box 
                component="main" 
                sx={{ 
                  flex: 1, 
                  width: '100%',
                  maxWidth: '100%',
                  overflowY: 'auto',
                  overflowX: 'hidden'
                }}
              >
                <Routes>
                  <Route path="/login" element={<Navigate to="/" />} />
                  <Route path="/" element={<HomePage />} />
                  <Route path="/calculations" element={<CalculationsPage />} />
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Box>
            </Box>
          )}
        </Router>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;
