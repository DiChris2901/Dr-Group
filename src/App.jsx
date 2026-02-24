import { Box, CircularProgress } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { lazy, Suspense } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import SettingsProvider from './context/SettingsContext';
import { CustomThemeProvider } from './context/ThemeContext';
import ToastProvider from './context/ToastContext';

// Components (estáticos — se usan en la carga inicial)
import AdminOnlyRoute from './components/auth/AdminOnlyRoute';
import LoginForm from './components/auth/LoginForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import BackgroundProvider from './components/layout/BackgroundProvider';
import MainLayout from './components/layout/MainLayout';

// Pages estáticas (primera pantalla o críticas)
import WelcomeDashboardSimple from './components/dashboard/WelcomeDashboardSimple';
import AdminSetupPage from './pages/AdminSetupPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Pages lazy-loaded (code splitting — se cargan bajo demanda)
const ClientesPage = lazy(() => import('./pages/ClientesPage'));
const CommitmentsPage = lazy(() => import('./pages/CommitmentsPage'));
const CompaniesPage = lazy(() => import('./pages/CompaniesPage'));
const EmpleadosPage = lazy(() => import('./pages/EmpleadosPage'));
const NewCommitmentPage = lazy(() => import('./pages/NewCommitmentPage'));
const NewPaymentPage = lazy(() => import('./pages/NewPaymentPage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ReportsCompanyPage = lazy(() => import('./pages/reports/ReportsCompanyPage'));
const ReportsConceptPage = lazy(() => import('./pages/reports/ReportsConceptPage'));
const ReportsPeriodPage = lazy(() => import('./pages/reports/ReportsPeriodPage'));
const ReportsSummaryPage = lazy(() => import('./pages/reports/ReportsSummaryPage'));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));
const BankAccountsPage = lazy(() => import('./pages/BankAccountsPage'));
const IncomeHistoryPage = lazy(() => import('./pages/IncomeHistoryPage'));
const IncomePage = lazy(() => import('./pages/IncomePage'));
const ExecutiveDashboardPage = lazy(() => import('./pages/ExecutiveDashboardPage'));
const ActivityLogsPage = lazy(() => import('./pages/ActivityLogsPage'));
const OrphanFilesPage = lazy(() => import('./pages/OrphanFilesPage'));
const LiquidacionesEstadisticasPage = lazy(() => import('./pages/LiquidacionesEstadisticasPage'));
const LiquidacionesHistorialPage = lazy(() => import('./pages/LiquidacionesHistorialPage'));
const LiquidacionesPage = lazy(() => import('./pages/LiquidacionesPage'));
const LiquidacionesPorSalaPage = lazy(() => import('./pages/LiquidacionesPorSalaPage'));
const FacturacionPage = lazy(() => import('./pages/FacturacionPage'));
const SalasPage = lazy(() => import('./pages/SalasPage'));
const AlertsCenterPage = lazy(() => import('./pages/AlertsCenterPage'));
const AsistenciasPage = lazy(() => import('./pages/AsistenciasPage'));
const RecursosHumanosPage = lazy(() => import('./pages/RecursosHumanosPage'));
const SolicitudesPage = lazy(() => import('./pages/SolicitudesPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));

// Hook de autenticación
import { useAuth } from './context/AuthContext';

// Componente principal del dashboard
const DashboardLayout = () => {
  const { currentUser, userProfile } = useAuth();

  return (
    <Suspense fallback={
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    }>
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
      <Route 
        path="/liquidaciones/estadisticas" 
        element={
          <ProtectedRoute requiredPermission="liquidaciones">
            <MainLayout title="Estadísticas de Liquidaciones" breadcrumbs={['Liquidaciones', 'Estadísticas']}>
              <LiquidacionesEstadisticasPage />
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
      
      {/* ===== RUTAS PROTEGIDAS - TAREAS DELEGADAS ===== */}
      <Route 
        path="/tasks" 
        element={
          <ProtectedRoute requiredPermissions={['tareas', 'tareas.asignar', 'tareas.ver_propias']}>
            <MainLayout title="Gestión de Tareas" breadcrumbs={['Tareas']}>
              <TasksPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      {/* ===== RUTAS PROTEGIDAS - RRHH ===== */}
      <Route 
        path="/recursos-humanos" 
        element={
          <ProtectedRoute requiredPermissions={['rrhh', 'rrhh.dashboard', 'rrhh.liquidaciones', 'rrhh.reportes', 'solicitudes', 'solicitudes.gestionar']}>
            <MainLayout title="Talento Humano" breadcrumbs={['RRHH', 'Talento Humano']}>
              <RecursosHumanosPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      {/* Ruta independiente: Solicitudes para empleados (permiso 'solicitudes') */}
      <Route 
        path="/solicitudes" 
        element={
          <ProtectedRoute requiredPermission="solicitudes">
            <MainLayout title="Mis Solicitudes" breadcrumbs={['RRHH', 'Solicitudes']}>
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
    </Suspense>
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
