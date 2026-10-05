import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { HRAdminDashboard } from './HRAdminDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { EmployeeDashboard } from './EmployeeDashboard';

export const DashboardPage: React.FC = () => {
  const { role } = useAuth();

  switch (role) {
    case 'Employee':
      return <EmployeeDashboard />;
    case 'Manager':
      return <ManagerDashboard />;
    case 'HR Admin':
    case 'System Administrator':
    case 'HR Executive':
    case 'Payroll Officer':
    default:
      return <HRAdminDashboard />;
  }
};
