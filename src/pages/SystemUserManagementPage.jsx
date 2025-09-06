import React from 'react';
import SystemLayout from '../components/layout/SystemLayout';
import UserManagementPage from './UserManagementPage';

const SystemUserManagementPage = () => {
  return (
    <SystemLayout>
      <UserManagementPage />
    </SystemLayout>
  );
};

export default SystemUserManagementPage;
