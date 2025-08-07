import React, { useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, Alert, Typography } from '@mui/material';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { CustomThemeProvider, useTheme } from './context/ThemeContext';
import SettingsProvider from './context/SettingsContext';
import { NotificationsProvider } from './context/NotificationsContext';
import ToastProvider from './context/ToastContext';

// Components
import LoginForm from './components/auth/LoginForm';
import MainLayout from './components/layout/MainLayout';
import BackgroundProvider from './components/layout/BackgroundProvider';

// Pages
import CommitmentsPage from './pages/CommitmentsPage';
import DueCommitmentsPage from './pages/DueCommitmentsPage';
import NewCommitmentPage from './pages/NewCommitmentPage';
import PaymentsPage from './pages/PaymentsPage';
import NewPaymentPage from './pages/NewPaymentPage';
import ProfilePage from './pages/ProfilePage';
import DataPage from './pages/DataPage';
import CompaniesPage from './pages/CompaniesPage';
import UserManagementPage from './pages/UserManagementPage';
import AdminSetupPage from './pages/AdminSetupPage';
import ReceiptsPage from './pages/ReceiptsPage';
import ReportsSummaryPage from './pages/reports/ReportsSummaryPage';
import ReportsCompanyPage from './pages/reports/ReportsCompanyPage';
import ReportsPeriodPage from './pages/reports/ReportsPeriodPage';
import ReportsConceptPage from './pages/reports/ReportsConceptPage';
import WelcomeDashboardSimple from './components/dashboard/WelcomeDashboardSimple';

// Nuevos módulos profesionales
import ExecutiveDashboardPage from './pages/ExecutiveDashboardPage';
import AdvancedToolsPage from './pages/AdvancedToolsPage';
import FinancialKPIsPage from './pages/FinancialKPIsPage';
import LiquidationProcessorPage from './pages/LiquidationProcessorPage';

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
        path="/liquidation-processor" 
        element={
          <MainLayout title="Procesador de Liquidaciones" breadcrumbs={['Herramientas', 'Liquidaciones']}>
            <LiquidationProcessorPage />
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
        path="/receipts" 
        element={
          <MainLayout title="Gestión de Comprobantes" breadcrumbs={['Comprobantes']}>
            <ReceiptsPage />
          </MainLayout>
        }
      />
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
