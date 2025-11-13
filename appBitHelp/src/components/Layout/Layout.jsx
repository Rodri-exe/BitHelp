// eslint-disable-next-line no-unused-vars
import * as React from 'react';
import { useContext } from 'react';
import PropTypes from 'prop-types'; 
import DashboardIcon from '@mui/icons-material/Dashboard';
import { AppProvider, DashboardLayout, PageContainer } from '@toolpad/core'; 
import { useLocation, useNavigate } from 'react-router-dom';
import { extendTheme } from '@mui/material/styles';
import { useColorScheme } from '@mui/material/styles';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupIcon from '@mui/icons-material/Group';
import ViewListIcon from '@mui/icons-material/ViewList';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { AuthContext } from '../../context/AuthContext.jsx';

Layout.propTypes = { children: PropTypes.node.isRequired }; 

// --- CONFIGURACIÓN DE ROLES ---
const ROLE_ID_USER = 1;
const ROLE_ID_TECHNICIAN = 2;
const ROLE_ID_ADMIN = 3;

function getUserRoleId() {
  const sessionData = localStorage.getItem('userSession');
  if (sessionData) {
    try {
      const userData = JSON.parse(sessionData);
      return userData.idRol || null;
    } catch (error) {
      console.error('Error al parsear userSession de localStorage:', error);
      return null;
    }
  }
  return null;
}

export function Layout({ children }) { 
  const { user, logout } = useContext(AuthContext);
  
  // 1. Obtener el rol actual del usuario desde localStorage
  const userRoleId = getUserRoleId();
  
  // Determina si el usuario tiene el rol de Técnico
  const isTechnician = userRoleId == ROLE_ID_TECHNICIAN; 

  // Hooks de React Router
  const location = useLocation();
  const navigate = useNavigate();

  //  Generación dinámica del objeto de navegación (basado en el rol)
 const dynamicNavigation = React.useMemo(() => {
    // Definición base de los hijos de 'Tiquetes'
    const ticketChildren = [
      {
        segment: 'ticketsList',   
        title: 'Lista de Tiquetes',  
      },
    ];

    // Lógica Condicional para 'Tiquetes'
    if (isTechnician || userRoleId == ROLE_ID_ADMIN) {
      // Agrega 'Asignaciones' para Técnicos y Administradores
      ticketChildren.push({
        segment: 'assignments',
        title: 'Asignaciones',    
      });
    } else if (userRoleId == ROLE_ID_USER) {
      // Agrega 'Crear Tiquete' solo para Usuarios/Clientes
      ticketChildren.push({
        segment: 'createTicket',
        title: 'Crear Tiquete',    
      });
    }

    // Estructura base de la navegación
    const baseNavigation = [
      { kind: 'header', title: 'Menú Principal' },
      { segment: 'Home', title: 'Inicio', icon: <DashboardIcon /> },
      {
        segment: 'tickets',
        title: 'Tiquetes',
        icon: <AssignmentIcon />,
        children: ticketChildren,
      },
      { kind: 'divider' },
      // Mantenimientos visibles para todos los roles (Técnicos y Categorías)
      { kind: 'header', title: 'Administración' },
      // Si no quieres que todos vean el mantenimiento de Técnicos, deberías aplicar
      // una lógica similar a la de 'Usuarios' aquí, tal vez solo para Admin/Técnico.
      { segment: 'technician', title: 'Técnicos', icon: <GroupIcon /> },
      { kind: 'divider' },
      { segment: 'categories', title: 'Categorias', icon: <ViewListIcon/> },
      { kind: 'divider' },

      
    ];
    
    // Lógica Condicional: Agregar 'Usuarios' solo si es Administrador
    if (userRoleId == ROLE_ID_ADMIN) {
        baseNavigation.push(
            { segment: 'users', title: 'Usuarios', icon: <GroupIcon /> }
        );
    }
    
    return baseNavigation;

  }, [isTechnician, userRoleId]);
  
  // Objeto 'router' que Toolpad necesita
  const router = React.useMemo(() => {
    return {
      pathname: location.pathname,
      searchParams: new URLSearchParams(location.search),
      navigate: (path) => navigate(path),
    };
  }, [location.pathname, location.search, navigate]);

  const handleLogout = () => {
    logout();
  };

  return ( 
    <AppProvider
      navigation={dynamicNavigation}
      router={router}
      theme={demoTheme}
      branding={{
        logo: <LogoSwitcher/>,
        title: '', 
      }}
    >
      <DashboardLayout>
        {/* Botón de Logout */}
        <Box sx={{ 
          position: 'fixed', 
          top: 7, 
          right: 75, 
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: 'background.paper',
          padding: '8px 16px',
          borderRadius: 2,
          boxShadow: 2
        }}>
          {user && (
            <>
              <AccountCircleIcon color="primary" />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {user.nombre} {user.primerApellido}
              </Typography>
              <Tooltip title="Cerrar sesión">
                <IconButton 
                  onClick={handleLogout}
                  size="small"
                  color="error"
                >
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>

        <PageContainer title='' breadcrumbs={[]} maxWidth={false}>
          {children}
        </PageContainer>     
      </DashboardLayout>
    </AppProvider>
  ); 
} 

/**
 * @returns Función que permite evaluar si está en modo claro u oscuro y base a eso cambiar el logo de app
 */
function LogoSwitcher() {
  const { mode } = useColorScheme();

  const logoSrc = mode === 'dark'
    ? '/src/assets/BitHelpSinFondoDarkmode2.png'
    : '/src/assets/BitHelpSinFondoDarkmode2.png';

  return (
    <img
      src={logoSrc}
      alt="BitHelp Logo"
    />
  );
}

const demoTheme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        background: {
          default: '#f9f9f9',
        },
      },
    },
    dark: {
      palette: {
        background: {
          default: '#121212',
          paper: '#1c1c1c',
        },
      },
    },
  },
  colorSchemeSelector: 'class',
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900, 
      lg: 1200,
      xl: 1536,
    },
  },
});