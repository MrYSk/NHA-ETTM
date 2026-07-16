import * as React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { RequireRole } from '@/routes/RequireRole';

const LoginPage = React.lazy(() => import('@/features/auth/LoginPage'));
const DashboardPage = React.lazy(() => import('@/features/dashboard/DashboardPage'));
const EmployeesPage = React.lazy(() => import('@/features/employees/EmployeesPage'));
const AttendancePage = React.lazy(() => import('@/features/attendance/AttendancePage'));
const LeavesPage = React.lazy(() => import('@/features/leaves/LeavesPage'));
const SchedulesPage = React.lazy(() => import('@/features/schedules/SchedulesPage'));
const ShiftsPage = React.lazy(() => import('@/features/shifts/ShiftsPage'));
const SitesPage = React.lazy(() => import('@/features/sites/SitesPage'));
const RolesPage = React.lazy(() => import('@/features/roles/RolesPage'));
const ReportsPage = React.lazy(() => import('@/features/reports/ReportsPage'));
const SettingsPage = React.lazy(() => import('@/features/settings/SettingsPage'));
const NotFoundPage = React.lazy(() => import('@/features/not-found/NotFoundPage'));

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/employees', element: <EmployeesPage /> },
      { path: '/attendance', element: <AttendancePage /> },
      { path: '/leaves', element: <LeavesPage /> },
      { path: '/schedules', element: <SchedulesPage /> },
      { path: '/shifts', element: <ShiftsPage /> },
      { path: '/sites', element: <SitesPage /> },
      {
        path: '/roles',
        element: (
          <RequireRole>
            <RolesPage />
          </RequireRole>
        ),
      },
      { path: '/reports', element: <ReportsPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/404', element: <NotFoundPage /> },
      { path: '*', element: <Navigate to="/404" replace /> },
    ],
  },
]);
