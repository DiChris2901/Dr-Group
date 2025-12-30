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
import ProtectedRoute from './components/auth/ProtectedRoute';
import BackgroundProvider from './components/layout/BackgroundProvider';
import MainLayout from './components/layout/MainLayout';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';

// Pages
import WelcomeDashboardSimple from './components/dashboard/WelcomeDashboardSimple';
import AdminSetupPage from './pages/AdminSetupPage';
import CommitmentsPage from './pages/CommitmentsPage';
import CompaniesPage from './pages/CompaniesPage';
import ClientesPage from './pages/ClientesPage';
import DataPage from './pages/DataPage';
import DueCommitmentsPage from './pages/DueCommitmentsPage';
import NewCommitmentPage from './pages/NewCommitmentPage';
import NewPaymentPage from './pages/NewPaymentPage';
import PaymentsPage from './pages/PaymentsPage';
import ProfilePage from './pages/ProfilePage';
import ReportsCompanyPage from './pages/reports/ReportsCompanyPage';
import ReportsConceptPage from './pages/reports/ReportsConceptPage';
import ReportsPeriodPage from './pages/reports/ReportsPeriodPage';
import ReportsSummaryPage from './pages/reports/ReportsSummaryPage';
import UserManagementPage from './pages/UserManagementPage';
import EmpleadosPage from './pages/EmpleadosPage';

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

// Módulo de Facturación
import FacturacionPage from './pages/FacturacionPage';

// Módulo de Salas
import SalasPage from './pages/SalasPage';

// Centro de Alertas
import AlertsCenterPage from './pages/AlertsCenterPage';

// Módulo de Asistencias
import AsistenciasPage from './pages/AsistenciasPage';

// Módulo de Recursos Humanos
import RecursosHumanosPage from './pages/RecursosHumanosPage';
import SolicitudesPage from './pages/SolicitudesPage';

// Página de acceso denegado
import UnauthorizedPage from './pages/UnauthorizedPage';

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
      {/* ===== RUTAS PROTEGIDAS - COMPROMISOS ===== */}
      <Route 
        path="/commitments" 
        element={
          <ProtectedRoute requiredPermission="compromisos">
            <MainLayout title="Compromisos Financieros" breadcrumbs={['Compromisos']}>
              <CommitmentsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/commitments/new" 
        element={
          <ProtectedRoute requiredPermission="compromisos">
            <MainLayout title="Nuevo Compromiso" breadcrumbs={['Compromisos', 'Nuevo']}>
              <NewCommitmentPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/commitments/due" 
        element={
          <ProtectedRoute requiredPermission="compromisos">
            <MainLayout title="Compromisos Próximos a Vencer" breadcrumbs={['Compromisos', 'Próximos a Vencer']}>
              <DueCommitmentsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      {/* ===== RUTAS PROTEGIDAS - GESTIÓN EMPRESARIAL ===== */}
      <Route 
        path="/companies" 
        element={
          <ProtectedRoute requiredPermission="gestion_empresarial.empresas">
            <MainLayout title="Gestión de Empresas" breadcrumbs={['Empresas']}>
              <CompaniesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/clientes" 
        element={
          <ProtectedRoute requiredPermission="gestion_empresarial.clientes">
            <MainLayout title="Gestión de Clientes" breadcrumbs={['Gestión Empresarial', 'Clientes']}>
              <ClientesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      {/* ===== RUTAS PROTEGIDAS - PAGOS ===== */}
      <Route 
        path="/payments" 
        element={
          <ProtectedRoute requiredPermission="pagos">
            <MainLayout title="Gestión de Pagos" breadcrumbs={['Pagos']}>
              <PaymentsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/payments/new" 
        element={
          <ProtectedRoute requiredPermission="pagos">
            <MainLayout title="Nuevo Pago" breadcrumbs={['Pagos', 'Nuevo']}>
              <NewPaymentPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      {/* ===== RUTAS PROTEGIDAS - INGRESOS ===== */}
      <Route 
        path="/income" 
        element={
          <ProtectedRoute requiredPermission="ingresos">
            <MainLayout title="Gestión de Ingresos" breadcrumbs={['Ingresos']}>
              <IncomePage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/income/history" 
        element={
          <ProtectedRoute requiredPermission="ingresos">
            <MainLayout title="Histórico de Consignaciones" breadcrumbs={['Ingresos', 'Histórico']}>
              <IncomeHistoryPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/income/accounts" 
        element={
          <ProtectedRoute requiredPermission="ingresos">
            <MainLayout title="Cuentas Bancarias" breadcrumbs={['Ingresos', 'Cuentas Bancarias']}>
              <BankAccountsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      {/* ===== RUTAS PROTEGIDAS - LIQUIDACIONES ===== */}
      <Route 
        path="/liquidaciones" 
        element={
          <ProtectedRoute requiredPermission="liquidaciones">
            <MainLayout title="Liquidaciones" breadcrumbs={['Liquidaciones']}>
              <LiquidacionesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/liquidaciones/historico" 
        element={
          <ProtectedRoute requiredPermission="liquidaciones">
            <MainLayout title="Histórico de Liquidaciones" breadcrumbs={['Liquidaciones', 'Histórico']}>
              <LiquidacionesHistorialPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      {/* ===== RUTAS PROTEGIDAS - FACTURACIÓN ===== */}
      <Route 
        path="/facturacion/liquidaciones-por-sala" 
        element={
          <ProtectedRoute requiredPermission="facturacion.liquidaciones_por_sala">
            <MainLayout title="Liquidaciones por Sala" breadcrumbs={['Facturación', 'Liquidaciones por Sala']}>
              <LiquidacionesPorSalaPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/facturacion/cuentas-cobro" 
        element={
          <ProtectedRoute requiredPermission="facturacion.cuentas_cobro">
            <MainLayout title="Cuentas de Cobro" breadcrumbs={['Facturación', 'Cuentas de Cobro']}>
              <FacturacionPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/facturacion/salas" 
        element={
          <ProtectedRoute requiredPermission="gestion_empresarial.salas">
            <MainLayout title="Gestión de Salas" breadcrumbs={['Gestión Empresarial', 'Salas']}>
              <SalasPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      {/* ===== RUTAS PROTEGIDAS - REPORTES ===== */}
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute requiredPermission="reportes">
            <MainLayout title="Reportes y Análisis" breadcrumbs={['Reportes']}>
              <Box sx={{ p: 2 }}>
                <h2>Reportes Financieros</h2>
                <p>Próximamente: Generación de reportes</p>
              </Box>
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/reports/summary" 
        element={
          <ProtectedRoute requiredPermission="reportes">
            <MainLayout title="Resumen Ejecutivo" breadcrumbs={['Reportes', 'Resumen']}>
              <ReportsSummaryPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/reports/company" 
        element={
          <ProtectedRoute requiredPermission="reportes">
            <MainLayout title="Reportes por Empresa" breadcrumbs={['Reportes', 'Por Empresa']}>
              <ReportsCompanyPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/reports/period" 
        element={
          <ProtectedRoute requiredPermission="reportes">
            <MainLayout title="Reportes por Período" breadcrumbs={['Reportes', 'Por Período']}>
              <ReportsPeriodPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/reports/concept" 
        element={
          <ProtectedRoute requiredPermission="reportes">
            <MainLayout title="Reportes por Concepto" breadcrumbs={['Reportes', 'Por Concepto']}>
              <ReportsConceptPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      {/* ===== RUTAS PROTEGIDAS - DASHBOARD EJECUTIVO ===== */}
      <Route 
        path="/reports/executive" 
        element={
          <ProtectedRoute requiredPermission="reportes">
            <MainLayout title="Dashboard Ejecutivo" breadcrumbs={['Reportes', 'Ejecutivo']}>
              <ExecutiveDashboardPage />
            </MainLayout>
          </ProtectedRoute>
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
      {/* ===== RUTAS PROTEGIDAS - ADMINISTRACIÓN ===== */}
      <Route 
        path="/users" 
        element={
          <ProtectedRoute requiredPermission="usuarios">
            <MainLayout title="Gestión de Usuarios" breadcrumbs={['Administración', 'Usuarios']}>
              <UserManagementPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/empleados" 
        element={
          <ProtectedRoute requiredPermission="empleados">
            <MainLayout title="Gestión de Empleados" breadcrumbs={['Administración', 'Empleados']}>
              <EmpleadosPage />
            </MainLayout>
          </ProtectedRoute>
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
          <ProtectedRoute requiredPermission="storage">
            <MainLayout title="Limpieza de Storage" breadcrumbs={['Administración', 'Storage']}>
              <OrphanFilesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/asistencias" 
        element={
          <ProtectedRoute requiredPermission="asistencias">
            <MainLayout title="Control de Asistencias" breadcrumbs={['Administración', 'Asistencias']}>
              <AsistenciasPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/recursos-humanos" 
        element={
          <ProtectedRoute requiredPermission="rrhh">
            <MainLayout title="Talento Humano" breadcrumbs={['RRHH', 'Talento Humano']}>
              <RecursosHumanosPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/solicitudes" 
        element={
          <ProtectedRoute requiredPermission="solicitudes">
            <MainLayout title="Solicitudes" breadcrumbs={['RRHH', 'Solicitudes']}>
              <SolicitudesPage />
            </MainLayout>
          </ProtectedRoute>
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

      {/* ===== PÁGINA DE ACCESO DENEGADO ===== */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
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
        
        {/* Componente PWA Install Prompt */}
        <PWAInstallPrompt />
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
