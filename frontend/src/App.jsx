import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PAGE_ROLES, ROLE_LANDING } from './config/roleAccess';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })));
const ContractorsPage = lazy(() => import('./pages/ContractorsPage').then(m => ({ default: m.ContractorsPage })));
const ContractsPage = lazy(() => import('./pages/ContractsPage').then(m => ({ default: m.ContractsPage })));
const DrawingsPage = lazy(() => import('./pages/DrawingsPage').then(m => ({ default: m.DrawingsPage })));
const BOQReviewPage = lazy(() => import('./pages/BOQReviewPage').then(m => ({ default: m.BOQReviewPage })));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage').then(m => ({ default: m.PaymentsPage })));
const QualityChecksPage = lazy(() => import('./pages/QualityChecksPage').then(m => ({ default: m.QualityChecksPage })));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage').then(m => ({ default: m.EmployeesPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const CompletionPercentagePage = lazy(() => import('./pages/CompletionPercentagePage').then(m => ({ default: m.CompletionPercentagePage })));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })));
const BOQSummaryPage = lazy(() => import('./pages/BOQSummaryPage').then(m => ({ default: m.BOQSummaryPage })));
const PriceLibraryPage = lazy(() => import('./pages/PriceLibraryPage').then(m => ({ default: m.PriceLibraryPage })));
const ClassificationDashboard = lazy(() => import('./pages/ClassificationDashboard').then(m => ({ default: m.ClassificationDashboard })));
const BatchUploadPage = lazy(() => import('./pages/BatchUploadPage').then(m => ({ default: m.BatchUploadPage })));
const DrawingViewerPage = lazy(() => import('./pages/DrawingViewerPage').then(m => ({ default: m.DrawingViewerPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));

const PageLoader = () => (
  <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-slate-400 font-semibold">جارٍ تحميل الصفحة...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ roles, children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }
  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={ROLE_LANDING[user.role] || '/dashboard'} replace />;
  }
  return children;
};

function getRouteRoles(path) {
  const matched = Object.entries(PAGE_ROLES).find(([key]) => {
    if (key.includes(':')) {
      const pattern = new RegExp('^' + key.replace(/:\w+/g, '[^/]+') + '$');
      return pattern.test(path);
    }
    return key === path;
  });
  return matched ? matched[1] : undefined;
}

const AppRoutes = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          <Route path="/dashboard" element={
            <ProtectedRoute roles={getRouteRoles('/dashboard')}><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute roles={getRouteRoles('/projects')}><ProjectsPage /></ProtectedRoute>
          } />
          <Route path="/projects/:projectId" element={
            <ProtectedRoute roles={getRouteRoles('/projects/:projectId')}><ProjectDetailPage /></ProtectedRoute>
          } />
          <Route path="/contractors" element={
            <ProtectedRoute roles={getRouteRoles('/contractors')}><ContractorsPage /></ProtectedRoute>
          } />
          <Route path="/contracts" element={
            <ProtectedRoute roles={getRouteRoles('/contracts')}><ContractsPage /></ProtectedRoute>
          } />
          <Route path="/drawings" element={
            <ProtectedRoute roles={getRouteRoles('/drawings')}><DrawingsPage /></ProtectedRoute>
          } />
          <Route path="/boq-review" element={
            <ProtectedRoute roles={getRouteRoles('/boq-review')}><BOQReviewPage /></ProtectedRoute>
          } />
          <Route path="/payments" element={
            <ProtectedRoute roles={getRouteRoles('/payments')}><PaymentsPage /></ProtectedRoute>
          } />
          <Route path="/quality-checks" element={
            <ProtectedRoute roles={getRouteRoles('/quality-checks')}><QualityChecksPage /></ProtectedRoute>
          } />
          <Route path="/employees" element={
            <ProtectedRoute roles={getRouteRoles('/employees')}><EmployeesPage /></ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute roles={getRouteRoles('/reports')}><ReportsPage /></ProtectedRoute>
          } />
          <Route path="/completion-percentage" element={
            <ProtectedRoute roles={getRouteRoles('/completion-percentage')}><CompletionPercentagePage /></ProtectedRoute>
          } />
          <Route path="/audit-logs" element={
            <ProtectedRoute roles={getRouteRoles('/audit-logs')}><AuditLogsPage /></ProtectedRoute>
          } />
          <Route path="/boq-summary/:projectId" element={
            <ProtectedRoute roles={getRouteRoles('/boq-summary/:projectId')}><BOQSummaryPage /></ProtectedRoute>
          } />
          <Route path="/price-library" element={
            <ProtectedRoute roles={getRouteRoles('/price-library')}><PriceLibraryPage /></ProtectedRoute>
          } />
          <Route path="/boq-analytics" element={
            <ProtectedRoute roles={getRouteRoles('/boq-analytics')}><ClassificationDashboard /></ProtectedRoute>
          } />
          <Route path="/drawings/batch" element={
            <ProtectedRoute roles={getRouteRoles('/drawings/batch')}><BatchUploadPage /></ProtectedRoute>
          } />
          <Route path="/drawings/:drawingId" element={
            <ProtectedRoute roles={getRouteRoles('/drawings/:drawingId')}><DrawingViewerPage /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
