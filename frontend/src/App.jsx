import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { LandingPage } from './pages/LandingPage';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PAGE_ROLES, ROLE_LANDING } from './config/roleAccess';
import AppLayout from './layouts/AppLayout';

// QB-main pages (integrated from QB-main)
const HomePage = lazy(() => import('./pages/qb/HomePage').then(m => ({ default: m.HomePage })));
const SettingsPage = lazy(() => import('./pages/qb/SettingsPage').then(m => ({ default: m.SettingsPage })));
const QbProjectPage = lazy(() => import('./pages/qb/ProjectPage').then(m => ({ default: m.ProjectPage })));
const CostCalculatorPage = lazy(() => import('./pages/qb/CostCalculatorPage').then(m => ({ default: m.CostCalculatorPage })));
const QbRegisterPage = lazy(() => import('./pages/qb/RegisterPage').then(m => ({ default: m.RegisterPage })));
const QbForgotPasswordPage = lazy(() => import('./pages/qb/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const QbProfilePage = lazy(() => import('./pages/qb/ProfilePage').then(m => ({ default: m.ProfilePage })));
const QbLoginPage = lazy(() => import('./pages/qb/LoginPage').then(m => ({ default: m.LoginPage })));

const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })));
const ProjectViewPage = lazy(() => import('./pages/qb/ProjectViewPage').then(m => ({ default: m.ProjectViewPage })));
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
const QuickEstimatorPage = lazy(() => import('./pages/QuickEstimatorPage').then(m => ({ default: m.QuickEstimatorPage })));
const ClassificationDashboard = lazy(() => import('./pages/ClassificationDashboard').then(m => ({ default: m.ClassificationDashboard })));
const BatchUploadPage = lazy(() => import('./pages/BatchUploadPage').then(m => ({ default: m.BatchUploadPage })));
const DrawingViewerPage = lazy(() => import('./pages/DrawingViewerPage').then(m => ({ default: m.DrawingViewerPage })));
const AIPredictiveCenter = lazy(() => import('./components/qb/AIPredictiveCenter').then(m => ({ default: m.AIPredictiveCenter })));
const AdvancedCostMonitor = lazy(() => import('./components/qb/AdvancedCostMonitor').then(m => ({ default: m.AdvancedCostMonitor })));
const MaterialsManager = lazy(() => import('./components/qb/MaterialsManager').then(m => ({ default: m.MaterialsManager })));
const QbErrorBoundary = lazy(() => import('./components/qb/ErrorBoundary').then(m => ({ default: m.ErrorBoundary })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const OAuthSuccessPage = lazy(() => import('./pages/OAuthSuccessPage').then(m => ({ default: m.OAuthSuccessPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));

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
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={ROLE_LANDING[user.role] || '/dashboard'} replace />;
  }
  return children ?? <Outlet />;
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
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/oauth-success" element={<OAuthSuccessPage />} />

                    {/* QB-main pages */}
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/register" element={<QbRegisterPage />} />
                    <Route path="/project" element={<ProtectedRoute roles={getRouteRoles('/project')}><QbProjectPage /></ProtectedRoute>} />
                    <Route path="/cost-calculator" element={<ProtectedRoute roles={getRouteRoles('/cost-calculator')}><CostCalculatorPage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute roles={getRouteRoles('/profile')}><QbProfilePage /></ProtectedRoute>} />

                    <Route element={<ProtectedRoute />}>
            <Route path="/drawings/:drawingId" element={
              <ProtectedRoute roles={getRouteRoles('/drawings/:drawingId')}><DrawingViewerPage /></ProtectedRoute>
            } />
            <Route element={<AppLayout />}>
              <Route path="/users" element={
                <ProtectedRoute roles={getRouteRoles('/users')}><UsersPage /></ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute roles={getRouteRoles('/profile')}><ProfilePage /></ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute roles={getRouteRoles('/dashboard')}><DashboardPage /></ProtectedRoute>
              } />
              <Route path="/projects" element={
                <ProtectedRoute roles={getRouteRoles('/projects')}><ProjectsPage /></ProtectedRoute>
              } />
              <Route path="/projects/:projectId" element={
                <ProtectedRoute roles={getRouteRoles('/projects/:projectId')}><ProjectDetailPage /></ProtectedRoute>
              } />
              <Route path="/project/:projectId" element={
                <ProtectedRoute roles={getRouteRoles('/project/:projectId')}><ProjectViewPage /></ProtectedRoute>
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
              <Route path="/quick-estimator" element={
                <ProtectedRoute roles={getRouteRoles('/quick-estimator')}><QuickEstimatorPage /></ProtectedRoute>
              } />
              <Route path="/boq-analytics" element={
                <ProtectedRoute roles={getRouteRoles('/boq-analytics')}><ClassificationDashboard /></ProtectedRoute>
              } />
              <Route path="/drawings/batch" element={
                <ProtectedRoute roles={getRouteRoles('/drawings/batch')}><BatchUploadPage /></ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
