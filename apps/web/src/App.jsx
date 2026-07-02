
import React, { Suspense, lazy } from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import OnlineStatusIndicator from './components/OnlineStatusIndicator.jsx';
import { AGENT_TYPES } from './utils/roles.js';

// Pages
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'));
const PendingApprovalPage = lazy(() => import('./pages/PendingApprovalPage.jsx'));
const ParkingsPage = lazy(() => import('./pages/ParkingsPage.jsx'));

// Super Admin
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard.jsx'));

// Admin
const AdminAssociationDashboard = lazy(() => import('./pages/AdminAssociationDashboard.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const MembersPage = lazy(() => import('./pages/MembersPage.jsx'));
const AgentsPage = lazy(() => import('./pages/AgentsPage.jsx'));

// Agent / Recouvreur
const AgentDashboard = lazy(() => import('./pages/AgentDashboard.jsx'));
const ScannerPage = lazy(() => import('./pages/ScannerPage.jsx'));
const PaymentHistoryPage = lazy(() => import('./pages/PaymentHistoryPage.jsx'));
const MembersListPage = lazy(() => import('./pages/MembersListPage.jsx'));
const LatePaymentsPage = lazy(() => import('./pages/LatePaymentsPage.jsx'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.jsx'));
const AgentProfilePage = lazy(() => import('./pages/AgentProfilePage.jsx'));
const ComingSoonPage = lazy(() => import('./pages/ComingSoonPage.jsx'));

const AppFallback = () => (
  <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
    <div className="text-center">
      <img src="/assets/images/logo.png" alt="Alika Mobility" className="h-12 w-auto mx-auto mb-4 rounded-xl border border-border/30 shadow-md" />
      <p className="text-sm font-bold text-muted-foreground">Chargement Alika Mobility...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <OnlineStatusIndicator />
        <Suspense fallback={<AppFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/pending-approval" element={<PendingApprovalPage />} />

          {/* Super Admin Routes */}
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute allowedRoles={['super-admin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAssociationDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/members"
            element={
              <ProtectedRoute allowedRoles={['admin', 'agent']} allowedAgentTypes={[AGENT_TYPES.OFFICE_COLLECTOR]}>
                <MembersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agents"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AgentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parkings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ParkingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Agent Routes */}
          <Route
            path="/agent"
            element={
              <ProtectedRoute allowedRoles={['agent']}>
                <AgentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scanner"
            element={
              <ProtectedRoute allowedRoles={['agent']}>
                <ScannerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute allowedRoles={['agent']}>
                <PaymentHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-history"
            element={
              <ProtectedRoute allowedRoles={['agent']}>
                <PaymentHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/late-payments"
            element={
              <ProtectedRoute allowedRoles={['agent']}>
                <LatePaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/members-list"
            element={
              <ProtectedRoute allowedRoles={['agent']}>
                <MembersListPage />
              </ProtectedRoute>
            }
          />

          {/* Agent Profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['agent']}>
                <AgentProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Notification Routes */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={['super-admin', 'admin', 'agent']}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Coming Soon (placeholder pour modules pas encore développés) */}
          <Route
            path="/coming-soon/:module"
            element={
              <ProtectedRoute allowedRoles={['super-admin', 'admin', 'agent']}>
                <ComingSoonPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Not Found */}
          <Route path="*" element={<HomePage />} />
        </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
