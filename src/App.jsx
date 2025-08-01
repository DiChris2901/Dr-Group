import React, { useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { CustomThemeProvider, useTheme } from './context/ThemeContext';
import SettingsProvider from './context/SettingsContext';
import { NotificationsProvider } from './context/NotificationsContext';

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
import TasksPage from './pages/TasksPage';
import UserManagementPage from './pages/UserManagementPage';
import AdminSetupPage from './pages/AdminSetupPage';
import WelcomeDashboard from './components/dashboard/WelcomeDashboard';

// Debug Components
import FirebaseDebug from './components/debug/FirebaseDebug';

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
            <WelcomeDashboard />
          </MainLayout>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <MainLayout title="Dashboard Ejecutivo" breadcrumbs={['Inicio']}>
            <WelcomeDashboard />
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
        path="/tasks" 
        element={
          <MainLayout title="Gestión de Tareas" breadcrumbs={['Tareas']}>
            <TasksPage />
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
      <Route 
        path="/debug" 
        element={
          <MainLayout title="Firebase Debug" breadcrumbs={['Debug', 'Firebase']}>
            <FirebaseDebug />
          </MainLayout>
        } 
      />
      {userProfile?.role === 'ADMIN' && (
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
      )}
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
            <AppContent />
          </NotificationsProvider>
        </AuthProvider>
      </CustomThemeProvider>
    </SettingsProvider>
  );
}

export default App;
