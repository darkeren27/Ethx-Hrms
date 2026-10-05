import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ERPNextProvider } from './context/ERPNextContext';
import { AppLayout } from './components/layout/AppLayout';

// Features
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { OrgChartPage } from './features/organization/OrgChartPage';
import { EmployeeListPage } from './features/employees/EmployeeListPage';
import { EmployeeProfilePage } from './features/employees/EmployeeProfilePage';
import { AttendanceRosterPage } from './features/attendance/AttendanceRosterPage';
import { LeaveApprovalsPage } from './features/leave/LeaveApprovalsPage';
import { PayrollDashboardPage } from './features/payroll/PayrollDashboardPage';
import { RecruitmentKanbanPage } from './features/recruitment/RecruitmentKanbanPage';
import { PerformancePage } from './features/performance/PerformancePage';
import { SkillMatrixPage } from './features/training/SkillMatrixPage';
import { AssetManagementPage } from './features/assets/AssetManagementPage';
import { WorkforceAnalyticsPage } from './features/analytics/WorkforceAnalyticsPage';
import { ERPNextSettingsPage } from './features/settings/ERPNextSettingsPage';
import { InternshipLifecyclePage } from './features/internships/InternshipLifecyclePage';

import { RoleRoute } from './components/auth/RoleRoute';

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ERPNextProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="organization" element={<OrgChartPage />} />
                <Route
                  path="employees"
                  element={
                    <RoleRoute
                      allowedRoles={['HR Admin', 'System Administrator', 'HR Executive']}
                      customMessage="The master employee directory and personnel administration ledger is restricted to HR Administrators. As an Employee, you have exclusive access to your own 360 profile."
                    >
                      <EmployeeListPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="internships"
                  element={
                    <RoleRoute
                      allowedRoles={['HR Admin', 'System Administrator', 'HR Executive', 'Manager']}
                      customMessage="Internship cohort governance and conversion evaluations are restricted to authorized HR Personnel and Evaluators."
                    >
                      <InternshipLifecyclePage />
                    </RoleRoute>
                  }
                />
                <Route path="employees/:id" element={<EmployeeProfilePage />} />
                <Route path="attendance" element={<AttendanceRosterPage />} />
                <Route path="leave" element={<LeaveApprovalsPage />} />
                <Route path="payroll" element={<PayrollDashboardPage />} />
                <Route
                  path="recruitment"
                  element={
                    <RoleRoute
                      allowedRoles={['HR Admin', 'System Administrator', 'HR Executive']}
                      customMessage="Recruitment pipelines, candidate applications, and hiring evaluations are accessible only to HR Administrators."
                    >
                      <RecruitmentKanbanPage />
                    </RoleRoute>
                  }
                />
                <Route path="performance" element={<PerformancePage />} />
                <Route path="training" element={<SkillMatrixPage />} />
                <Route path="assets" element={<AssetManagementPage />} />
                <Route
                  path="analytics"
                  element={
                    <RoleRoute
                      allowedRoles={['HR Admin', 'System Administrator', 'HR Executive']}
                      customMessage="Strategic workforce analytics, salary distributions, and executive headcount intelligence are reserved for HR Administrators."
                    >
                      <WorkforceAnalyticsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <RoleRoute
                      allowedRoles={['HR Admin', 'System Administrator']}
                      customMessage="ERPNext integration credentials, API tokens, and database server configurations are reserved for System & HR Administrators."
                    >
                      <ERPNextSettingsPage />
                    </RoleRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ERPNextProvider>
    </QueryClientProvider>
  );
};

export default App;
