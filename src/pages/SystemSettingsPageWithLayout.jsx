import React from 'react';
import SystemLayout from '../components/layout/SystemLayout';
import SystemSettingsPage from './SystemSettingsPage';

const SystemSettingsPageWithLayout = () => {
  return (
    <SystemLayout>
      <SystemSettingsPage />
    </SystemLayout>
  );
};

export default SystemSettingsPageWithLayout;
