import React from 'react';
import SystemLayout from '../components/layout/SystemLayout';
import CompaniesManagementPage from './CompaniesManagementPage';

const CompaniesManagementPageWithLayout = () => {
  return (
    <SystemLayout>
      <CompaniesManagementPage />
    </SystemLayout>
  );
};

export default CompaniesManagementPageWithLayout;
