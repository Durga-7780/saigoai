/**
 * Main Application Component
 * Handles routing and theme configuration
 */
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { Provider } from 'react-redux';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { store } from './store';

// Pages
import AdminDashboard from './pages/AdminDashboard';
import Attendance from './pages/Attendance';
import Chatbot from './pages/Chatbot';
import Dashboard from './pages/Dashboard';
import DocumentsPage from './pages/DocumentsPage';
import LeaveManagement from './pages/LeaveManagement';
import Login from './pages/Login';
import MealBooking from './pages/MealBooking';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import SalaryPage from './pages/SalaryPage';
import VoiceBot from './pages/VoiceBot';

// Components
import { Box, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { authAPI } from './services/api';
import { setUser } from './store/slices/authSlice';

// Create premium theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#fff',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
      contrastText: '#fff',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '0em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '0.00735em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      letterSpacing: '0.0075em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.05)',
    '0px 4px 8px rgba(0,0,0,0.08)',
    '0px 8px 16px rgba(0,0,0,0.1)',
    '0px 12px 24px rgba(0,0,0,0.12)',
    '0px 16px 32px rgba(0,0,0,0.14)',
    '0px 20px 40px rgba(0,0,0,0.16)',
    '0px 24px 48px rgba(0,0,0,0.18)',
    '0px 28px 56px rgba(0,0,0,0.2)',
    '0px 32px 64px rgba(0,0,0,0.22)',
    '0px 36px 72px rgba(0,0,0,0.24)',
    '0px 40px 80px rgba(0,0,0,0.26)',
    '0px 44px 88px rgba(0,0,0,0.28)',
    '0px 48px 96px rgba(0,0,0,0.3)',
    '0px 52px 104px rgba(0,0,0,0.32)',
    '0px 56px 112px rgba(0,0,0,0.34)',
    '0px 60px 120px rgba(0,0,0,0.36)',
    '0px 64px 128px rgba(0,0,0,0.38)',
    '0px 68px 136px rgba(0,0,0,0.4)',
    '0px 72px 144px rgba(0,0,0,0.42)',
    '0px 76px 152px rgba(0,0,0,0.44)',
    '0px 80px 160px rgba(0,0,0,0.46)',
    '0px 84px 168px rgba(0,0,0,0.48)',
    '0px 88px 176px rgba(0,0,0,0.5)',
    '0px 92px 184px rgba(0,0,0,0.52)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.95rem',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0,0,0,0.15)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5568d3 0%, #6a4190 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 4px 20px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0px 8px 30px rgba(0,0,0,0.12)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function AppContent() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const [initLoading, setInitLoading] = useState(!!token && !user);

  useEffect(() => {
    const fetchUser = async () => {
      if (token && !user) {
        try {
          const response = await authAPI.getCurrentUser();
          dispatch(setUser(response.data));
        } catch (error) {
          console.error('Failed to fetch user:', error);
        } finally {
          setInitLoading(false);
        }
      } else {
        setInitLoading(false);
      }
    };
    fetchUser();
  }, [token, user, dispatch]);

  if (initLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const HomeRedirect = ({ user }) => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'admin') {
        return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomeRedirect user={user} />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="leaves" element={<LeaveManagement />} />
          <Route path="profile" element={<Profile />} />
          <Route path="chatbot" element={<Chatbot />} />
          <Route path="voicebot" element={<VoiceBot />} />
          <Route path="reports" element={<Reports />} />
          <Route path="salary" element={<SalaryPage />} />
          <Route path="meals" element={<MealBooking />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
}

export default App;
