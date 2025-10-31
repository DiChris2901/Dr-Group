import React from 'react';
import { Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { NotificationsProvider } from './context/NotificationsContext';
import SettingsProvider from './context/SettingsContext';
import { CustomThemeProvider } from './context/ThemeContext';
import ToastProvider from './context/ToastContext';

// Components
import LoginForm from './components/auth/LoginForm';
import AdminOnlyRoute from './components/auth/AdminOnlyRoute';
import BackgroundProvider from './components/layout/BackgroundProvider';
import MainLayout from './components/layout/MainLayout';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import AssistantButton from './components/assistant/AssistantButton';
import AssistantDrawer from './components/assistant/AssistantDrawer';

// Pages
import WelcomeDashboardSimple from './components/dashboard/WelcomeDashboardSimple';
import AdminSetupPage from './pages/AdminSetupPage';
import CleanupPage from './pages/CleanupPage';
import CommitmentsPage from './pages/CommitmentsPage';
import CompaniesPage from './pages/CompaniesPage';
import ClientesPage from './pages/ClientesPage';
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
import ExecutiveDashboardPage from './pages/ExecutiveDashboardPage';

// Módulo de Auditoría
import ActivityLogsPage from './pages/ActivityLogsPage';

// Administración - Limpieza de Storage
import OrphanFilesPage from './pages/OrphanFilesPage';

// Módulo de Liquidaciones
import LiquidacionesPage from './pages/LiquidacionesPage';
import LiquidacionesHistorialPage from './pages/LiquidacionesHistorialPage';
import LiquidacionesPorSalaPage from './pages/LiquidacionesPorSalaPage';

// Módulo de Salas
import SalasPage from './pages/SalasPage';

// Centro de Alertas
import AlertsCenterPage from './pages/AlertsCenterPage';

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
        path="/clientes" 
        element={
          <MainLayout title="Gestión de Clientes" breadcrumbs={['Gestión Empresarial', 'Clientes']}>
            <ClientesPage />
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
      
      {/* Rutas de Liquidaciones */}
      <Route 
        path="/liquidaciones" 
        element={
          <MainLayout title="Liquidaciones" breadcrumbs={['Liquidaciones']}>
            <LiquidacionesPage />
          </MainLayout>
        }
      />
      <Route 
        path="/liquidaciones/historico" 
        element={
          <MainLayout title="Histórico de Liquidaciones" breadcrumbs={['Liquidaciones', 'Histórico']}>
            <LiquidacionesHistorialPage />
          </MainLayout>
        }
      />
      
      {/* Rutas de Facturación */}
      <Route 
        path="/facturacion/liquidaciones-por-sala" 
        element={
          <MainLayout title="Liquidaciones por Sala" breadcrumbs={['Facturación', 'Liquidaciones por Sala']}>
            <LiquidacionesPorSalaPage />
          </MainLayout>
        }
      />
      <Route 
        path="/facturacion/salas" 
        element={
          <MainLayout title="Gestión de Salas" breadcrumbs={['Facturación', 'Salas']}>
            <SalasPage />
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
      {/* ========================================= */}
      <Route 
        path="/profile" 
        element={
          <MainLayout title="Mi Perfil" breadcrumbs={['Perfil']}>
            <ProfilePage />
          </MainLayout>
        }
      />
      {/* ========================================= */}
      {/* MÓDULO DE CHAT - Ahora es un componente flotante global */}
      {/* El chat está disponible en todas las páginas mediante FloatingChatButton */}
      {/* ========================================= */}
      {/* ========================================= */}
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
          <AdminOnlyRoute>
            <MainLayout title="Auditoría del Sistema" breadcrumbs={['Administración', 'Auditoría']}>
              <ActivityLogsPage />
            </MainLayout>
          </AdminOnlyRoute>
        }
      />
      <Route 
        path="/admin/orphan-files" 
        element={
          <MainLayout title="Limpieza de Storage" breadcrumbs={['Administración', 'Storage']}>
            <OrphanFilesPage />
          </MainLayout>
        }
      />
      <Route 
        path="/alerts" 
        element={
          <MainLayout title="Centro de Alertas" breadcrumbs={['Alertas']}>
            <AlertsCenterPage />
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
  const [assistantOpen, setAssistantOpen] = React.useState(false);

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
        
        {/* Componente PWA Install Prompt */}
        <PWAInstallPrompt />
        
        {/* 🤖 Asistente Inteligente - Solo visible cuando el usuario está autenticado */}
        {currentUser && (
          <>
            <AssistantButton 
              onClick={() => setAssistantOpen(true)}
              hasNewSuggestions={false}
            />
            <AssistantDrawer
              open={assistantOpen}
              onClose={() => setAssistantOpen(false)}
            />
          </>
        )}
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
            <ChatProvider>
              <ToastProvider>
                <AppContent />
              </ToastProvider>
            </ChatProvider>
          </NotificationsProvider>
        </AuthProvider>
      </CustomThemeProvider>
    </SettingsProvider>
  );
}

export default App;
