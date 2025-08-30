import { Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import SettingsProvider from './context/SettingsContext';
import { CustomThemeProvider } from './context/ThemeContext';
import ToastProvider from './context/ToastContext';

// Components
import LoginForm from './components/auth/LoginForm';
import BackgroundProvider from './components/layout/BackgroundProvider';
import MainLayout from './components/layout/MainLayout';

// Pages
import WelcomeDashboardSimple from './components/dashboard/WelcomeDashboardSimple';
import AdminSetupPage from './pages/AdminSetupPage';
import CleanupPage from './pages/CleanupPage';
import CommitmentsPage from './pages/CommitmentsPage';
import CompaniesPage from './pages/CompaniesPage';
import DataPage from './pages/DataPage';
import DueCommitmentsPage from './pages/DueCommitmentsPage';
import GlobalSearchPage from './pages/GlobalSearchPage';
import NewCommitmentPage from './pages/NewCommitmentPage';
import NewPaymentPage from './pages/NewPaymentPage';
import PaymentsPage from './pages/PaymentsPage';
import ProfilePage from './pages/ProfilePage';
import ReportsCompanyPage from './pages/reports/ReportsCompanyPage';
import ReportsConceptPage from './pages/reports/ReportsConceptPage';
import ReportsPeriodPage from './pages/reports/ReportsPeriodPage';
import ReportsSummaryPage from './pages/reports/ReportsSummaryPage';
import UserManagementPage from './pages/UserManagementPage';

// Módulo de Ingresos
import IncomePage from './pages/IncomePage';
import IncomeHistoryPage from './pages/IncomeHistoryPage';
import BankAccountsPage from './pages/BankAccountsPage';

// Nuevos módulos profesionales
import AdvancedToolsPage from './pages/AdvancedToolsPage';
import ExecutiveDashboardPage from './pages/ExecutiveDashboardPage';
import FinancialKPIsPage from './pages/FinancialKPIsPage';

// Módulo de Auditoría
import ActivityLogsPage from './pages/ActivityLogsPage';

// Hook de autenticación
import { useAuth } from './context/AuthContext';

// Componente principal del dashboard
const DashboardLayout = () => {
  const { currentUser, userProfile } = useAuth();

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <MainLayout title="Dashboard Ejecutivo" breadcrumbs={['Inicio']}>
            <WelcomeDashboardSimple />
          </MainLayout>
        }
      />
      <Route 
        path="/dashboard" 
        element={
          <MainLayout title="Dashboard Ejecutivo" breadcrumbs={['Inicio']}>
            <WelcomeDashboardSimple />
          </MainLayout>
        }
      />
      <Route 
        path="/data" 
        element={
          <MainLayout title="Centro de Análisis de Datos" breadcrumbs={['DATA']}>
            <DataPage />
          </MainLayout>
        }
      />
      <Route 
        path="/search" 
        element={
          <MainLayout title="Búsqueda Global" breadcrumbs={['Búsqueda']}>
            <GlobalSearchPage />
          </MainLayout>
        }
      />
      <Route 
        path="/commitments" 
        element={
          <MainLayout title="Compromisos Financieros" breadcrumbs={['Compromisos']}>
            <CommitmentsPage />
          </MainLayout>
        }
      />
      <Route 
        path="/commitments/new" 
        element={
          <MainLayout title="Nuevo Compromiso" breadcrumbs={['Compromisos', 'Nuevo']}>
            <NewCommitmentPage />
          </MainLayout>
        }
      />
      <Route 
        path="/commitments/due" 
        element={
          <MainLayout title="Compromisos Próximos a Vencer" breadcrumbs={['Compromisos', 'Próximos a Vencer']}>
            <DueCommitmentsPage />
          </MainLayout>
        }
      />
      <Route 
        path="/companies" 
        element={
          <MainLayout title="Gestión de Empresas" breadcrumbs={['Empresas']}>
            <CompaniesPage />
          </MainLayout>
        }
      />
      <Route 
        path="/payments" 
        element={
          <MainLayout title="Gestión de Pagos" breadcrumbs={['Pagos']}>
            <PaymentsPage />
          </MainLayout>
        }
      />
      <Route 
        path="/payments/new" 
        element={
          <MainLayout title="Nuevo Pago" breadcrumbs={['Pagos', 'Nuevo']}>
            <NewPaymentPage />
          </MainLayout>
        }
      />
      
      {/* Rutas de Ingresos */}
      <Route 
        path="/income" 
        element={
          <MainLayout title="Gestión de Ingresos" breadcrumbs={['Ingresos']}>
            <IncomePage />
          </MainLayout>
        }
      />
      <Route 
        path="/income/history" 
        element={
          <MainLayout title="Histórico de Consignaciones" breadcrumbs={['Ingresos', 'Histórico']}>
            <IncomeHistoryPage />
          </MainLayout>
        }
      />
      <Route 
        path="/income/accounts" 
        element={
          <MainLayout title="Cuentas Bancarias" breadcrumbs={['Ingresos', 'Cuentas Bancarias']}>
            <BankAccountsPage />
          </MainLayout>
        }
      />
      
      <Route 
        path="/reports" 
        element={
          <MainLayout title="Reportes y Análisis" breadcrumbs={['Reportes']}>
            <Box sx={{ p: 2 }}>
              <h2>Reportes Financieros</h2>
              <p>Próximamente: Generación de reportes</p>
            </Box>
          </MainLayout>
        }
      />
      <Route 
        path="/reports/summary" 
        element={
          <MainLayout title="Resumen Ejecutivo" breadcrumbs={['Reportes', 'Resumen']}>
            <ReportsSummaryPage />
          </MainLayout>
        }
      />
      <Route 
        path="/reports/company" 
        element={
          <MainLayout title="Reportes por Empresa" breadcrumbs={['Reportes', 'Por Empresa']}>
            <ReportsCompanyPage />
          </MainLayout>
        }
      />
      <Route 
        path="/reports/period" 
        element={
          <MainLayout title="Reportes por Período" breadcrumbs={['Reportes', 'Por Período']}>
            <ReportsPeriodPage />
          </MainLayout>
        }
      />
      <Route 
        path="/reports/concept" 
        element={
          <MainLayout title="Reportes por Concepto" breadcrumbs={['Reportes', 'Por Concepto']}>
            <ReportsConceptPage />
          </MainLayout>
        }
      />
      
      {/* ===== NUEVOS MÓDULOS PROFESIONALES ===== */}
      <Route 
        path="/reports/executive" 
        element={
          <MainLayout title="Dashboard Ejecutivo" breadcrumbs={['Reportes', 'Ejecutivo']}>
            <ExecutiveDashboardPage />
          </MainLayout>
        }
      />
      <Route 
        path="/tools" 
        element={
          <MainLayout title="Herramientas Avanzadas" breadcrumbs={['Herramientas']}>
            <AdvancedToolsPage />
          </MainLayout>
        }
      />
      <Route 
        path="/kpis" 
        element={
          <MainLayout title="KPIs Financieros" breadcrumbs={['KPIs']}>
            <FinancialKPIsPage />
          </MainLayout>
        }
      />
      {/* ========================================= */}
      <Route 
        path="/profile" 
        element={
          <MainLayout title="Mi Perfil" breadcrumbs={['Perfil']}>
            <ProfilePage />
          </MainLayout>
        }
      />
      {/* Ruta temporal sin restricción de rol */}
      <Route 
        path="/users" 
        element={
          <MainLayout title="Gestión de Usuarios" breadcrumbs={['Administración', 'Usuarios']}>
            <UserManagementPage />
          </MainLayout>
        }
      />
      <Route 
        path="/admin/cleanup" 
        element={
          <MainLayout title="Limpieza de Datos" breadcrumbs={['Administración', 'Limpieza']}>
            <CleanupPage />
          </MainLayout>
        }
      />
      <Route 
        path="/admin/activity-logs" 
        element={
          <MainLayout title="Auditoría del Sistema" breadcrumbs={['Administración', 'Auditoría']}>
            <ActivityLogsPage />
          </MainLayout>
        }
      />
      {/* {userProfile?.role === 'ADMIN' && (
        <>
          <Route 
            path="/users" 
            element={
              <MainLayout title="Gestión de Usuarios" breadcrumbs={['Administración', 'Usuarios']}>
                <UserManagementPage />
              </MainLayout>
            }
          />
        </>
      )} */}
    </Routes>
  );
};

// Componente principal de la aplicación
const AppContent = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        bgcolor="background.default"
      >
        <div>Cargando...</div>
      </Box>
    );
  }

  return (
    <Router>
      <BackgroundProvider>
        <Routes>
          {/* Ruta de setup inicial - accesible sin autenticación */}
          <Route path="/admin-setup" element={<AdminSetupPage />} />
          
          {/* Rutas principales */}
          <Route path="/*" element={currentUser ? <DashboardLayout /> : <LoginForm />} />
        </Routes>
      </BackgroundProvider>
    </Router>
  );
};

function App() {
  return (
    <SettingsProvider>
      <CustomThemeProvider>
        <CssBaseline />
        <AuthProvider>
          <NotificationsProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </NotificationsProvider>
        </AuthProvider>
      </CustomThemeProvider>
    </SettingsProvider>
  );
}

export default App;
