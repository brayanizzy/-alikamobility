
import React, { Suspense, lazy } from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import OnlineStatusIndicator from './components/OnlineStatusIndicator.jsx';
import MobileBottomNav from './components/MobileBottomNav.jsx';
import { AGENT_TYPES } from './utils/roles.js';
import { useAuth } from './contexts/AuthContext.jsx';

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
const NotificationSendPage = lazy(() => import('./pages/NotificationSendPage.jsx'));
const AgentProfilePage = lazy(() => import('./pages/AgentProfilePage.jsx'));
const ComingSoonPage = lazy(() => import('./pages/ComingSoonPage.jsx'));

// Transport Module
const DriversPage = lazy(() => import('./pages/DriversPage.jsx'));
const DriverCreatePage = lazy(() => import('./pages/DriverCreatePage.jsx'));
const DriverDetailPage = lazy(() => import('./pages/DriverDetailPage.jsx'));
const DriverEditPage = lazy(() => import('./pages/DriverEditPage.jsx'));
const OwnersPage = lazy(() => import('./pages/OwnersPage.jsx'));
const OwnerCreatePage = lazy(() => import('./pages/OwnerCreatePage.jsx'));
const OwnerDetailPage = lazy(() => import('./pages/OwnerDetailPage.jsx'));

// Module 4 - Vehicles
const VehiclesPage = lazy(() => import('./pages/VehiclesPage.jsx'));
const VehicleCreatePage = lazy(() => import('./pages/VehicleCreatePage.jsx'));
const VehicleDetailPage = lazy(() => import('./pages/VehicleDetailPage.jsx'));
const VehicleEditPage = lazy(() => import('./pages/VehicleEditPage.jsx'));

// Module 4 - Documents
const DocumentsPage = lazy(() => import('./pages/DocumentsPage.jsx'));
const DocumentCreatePage = lazy(() => import('./pages/DocumentCreatePage.jsx'));
const DocumentDetailPage = lazy(() => import('./pages/DocumentDetailPage.jsx'));
const DocumentEditPage = lazy(() => import('./pages/DocumentEditPage.jsx'));

// Module 5 - Lines
const LinesPage = lazy(() => import('./pages/LinesPage.jsx'));
const LineCreatePage = lazy(() => import('./pages/LineCreatePage.jsx'));
const LineDetailPage = lazy(() => import('./pages/LineDetailPage.jsx'));
const LineEditPage = lazy(() => import('./pages/LineEditPage.jsx'));

// Module 5 - Assignments
const AssignmentsPage = lazy(() => import('./pages/AssignmentsPage.jsx'));
const AssignmentCreatePage = lazy(() => import('./pages/AssignmentCreatePage.jsx'));
const AssignmentDetailPage = lazy(() => import('./pages/AssignmentDetailPage.jsx'));
const AssignmentEditPage = lazy(() => import('./pages/AssignmentEditPage.jsx'));

// Module 5 - Parking Detail
const ParkingDetailPage = lazy(() => import('./pages/ParkingDetailPage.jsx'));

// Module 6 - Debts
const DebtsPage = lazy(() => import('./pages/DebtsPage.jsx'));
const DebtCreatePage = lazy(() => import('./pages/DebtCreatePage.jsx'));
const DebtDetailPage = lazy(() => import('./pages/DebtDetailPage.jsx'));
const DebtEditPage = lazy(() => import('./pages/DebtEditPage.jsx'));
const DebtPaymentPage = lazy(() => import('./pages/DebtPaymentPage.jsx'));

// Module 6 - Penalties
const PenaltiesPage = lazy(() => import('./pages/PenaltiesPage.jsx'));
const PenaltyCreatePage = lazy(() => import('./pages/PenaltyCreatePage.jsx'));
const PenaltyDetailPage = lazy(() => import('./pages/PenaltyDetailPage.jsx'));
const PenaltyEditPage = lazy(() => import('./pages/PenaltyEditPage.jsx'));

// Module 6 - Receipts
const ReceiptsPage = lazy(() => import('./pages/ReceiptsPage.jsx'));
const ReceiptDetailPage = lazy(() => import('./pages/ReceiptDetailPage.jsx'));

// Module 7 - Member Cards
const MemberCardsPage = lazy(() => import('./pages/MemberCardsPage.jsx'));
const MemberCardCreatePage = lazy(() => import('./pages/MemberCardCreatePage.jsx'));
const MemberCardDetailPage = lazy(() => import('./pages/MemberCardDetailPage.jsx'));
const MemberCardEditPage = lazy(() => import('./pages/MemberCardEditPage.jsx'));
const MemberCardPrintPage = lazy(() => import('./pages/MemberCardPrintPage.jsx'));

// Module 7 - Card Verification (public)
const CardVerifyPage = lazy(() => import('./pages/CardVerifyPage.jsx'));

// Module 8 - Offline
const OfflineSyncPage = lazy(() => import('./pages/OfflineSyncPage.jsx'));
const OfflinePaymentPage = lazy(() => import('./pages/OfflinePaymentPage.jsx'));

// Module 9 - Reports
const CashReportPage = lazy(() => import('./pages/CashReportPage.jsx'));

const AppFallback = () => (
  <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
    <div className="text-center">
      <img src="/assets/images/logo.png" alt="Alika Mobility" className="h-12 w-auto mx-auto mb-4 rounded-xl border border-border/30 shadow-md" />
      <p className="text-sm font-bold text-muted-foreground">Chargement Alika Mobility...</p>
    </div>
  </div>
);

function AppContent() {
  const { isAuthenticated } = useAuth();
  return (
    <>
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
          <Route
            path="/reports/cashier"
            element={
              <ProtectedRoute allowedRoles={['admin', 'agent']} allowedAgentTypes={[AGENT_TYPES.OFFICE_COLLECTOR]}>
                <CashReportPage />
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
          <Route
            path="/notifications/send"
            element={
              <ProtectedRoute allowedRoles={['super-admin', 'admin']}>
                <NotificationSendPage />
              </ProtectedRoute>
            }
          />

          {/* Transport Routes */}
          <Route
            path="/drivers"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
                <DriversPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drivers/new"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
                <DriverCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drivers/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
                <DriverDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drivers/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
                <DriverEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owners"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
                <OwnersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owners/new"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
                <OwnerCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owners/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
                <OwnerDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Vehicle Routes */}
          <Route path="/vehicles"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'agent']}><VehiclesPage /></ProtectedRoute>} />
          <Route path="/vehicles/new"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin']}><VehicleCreatePage /></ProtectedRoute>} />
          <Route path="/vehicles/:id"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'agent']}><VehicleDetailPage /></ProtectedRoute>} />
          <Route path="/vehicles/:id/edit"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin']}><VehicleEditPage /></ProtectedRoute>} />

          {/* Document Routes */}
          <Route path="/documents"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'agent']}><DocumentsPage /></ProtectedRoute>} />
          <Route path="/documents/new"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin']}><DocumentCreatePage /></ProtectedRoute>} />
          <Route path="/documents/:id"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'agent']}><DocumentDetailPage /></ProtectedRoute>} />
          <Route path="/documents/:id/edit"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin']}><DocumentEditPage /></ProtectedRoute>} />

          {/* Parking Detail Route */}
          <Route path="/parkings/:id"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'agent']}><ParkingDetailPage /></ProtectedRoute>} />

          {/* Line Routes */}
          <Route path="/lines"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'agent']}><LinesPage /></ProtectedRoute>} />
          <Route path="/lines/new"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin']}><LineCreatePage /></ProtectedRoute>} />
          <Route path="/lines/:id"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'agent']}><LineDetailPage /></ProtectedRoute>} />
          <Route path="/lines/:id/edit"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin']}><LineEditPage /></ProtectedRoute>} />

          {/* Assignment Routes */}
          <Route path="/assignments"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'agent']}><AssignmentsPage /></ProtectedRoute>} />
          <Route path="/assignments/new"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin']}><AssignmentCreatePage /></ProtectedRoute>} />
          <Route path="/assignments/:id"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'agent']}><AssignmentDetailPage /></ProtectedRoute>} />
          <Route path="/assignments/:id/edit"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin']}><AssignmentEditPage /></ProtectedRoute>} />

          {/* Module 6 - Debt Routes */}
          <Route path="/debts"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'office_collector']}><DebtsPage /></ProtectedRoute>} />
          <Route path="/debts/new"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'office_collector']}><DebtCreatePage /></ProtectedRoute>} />
          <Route path="/debts/:id"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'office_collector']}><DebtDetailPage /></ProtectedRoute>} />
          <Route path="/debts/:id/edit"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'office_collector']}><DebtEditPage /></ProtectedRoute>} />
          <Route path="/debts/:id/pay"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'office_collector']}><DebtPaymentPage /></ProtectedRoute>} />

          {/* Module 6 - Penalty Routes */}
          <Route path="/penalties"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'office_collector']}><PenaltiesPage /></ProtectedRoute>} />
          <Route path="/penalties/new"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'office_collector']}><PenaltyCreatePage /></ProtectedRoute>} />
          <Route path="/penalties/:id"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'office_collector']}><PenaltyDetailPage /></ProtectedRoute>} />
          <Route path="/penalties/:id/edit"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'office_collector']}><PenaltyEditPage /></ProtectedRoute>} />

          {/* Module 6 - Receipt Routes */}
          <Route path="/receipts"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'agent']}><ReceiptsPage /></ProtectedRoute>} />
          <Route path="/receipts/:id"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'agent']}><ReceiptDetailPage /></ProtectedRoute>} />

          {/* Module 7 - Member Card Routes */}
          <Route path="/member-cards"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'agent']}><MemberCardsPage /></ProtectedRoute>} />
          <Route path="/member-cards/new"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin']}><MemberCardCreatePage /></ProtectedRoute>} />
          <Route path="/member-cards/:id"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'agent']}><MemberCardDetailPage /></ProtectedRoute>} />
          <Route path="/member-cards/:id/edit"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin']}><MemberCardEditPage /></ProtectedRoute>} />
          <Route path="/member-cards/:id/print"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'agent']}><MemberCardPrintPage /></ProtectedRoute>} />

          {/* Module 7 - Card Verification (public, no auth) */}
          <Route path="/verify/card/:cardNumber" element={<CardVerifyPage />} />

          {/* Module 8 - Offline Routes */}
          <Route path="/sync"
            element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'agent']}><OfflineSyncPage /></ProtectedRoute>} />
          <Route path="/offline-payment"
            element={<ProtectedRoute allowedRoles={['agent']}><OfflinePaymentPage /></ProtectedRoute>} />

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
      {isAuthenticated && <MobileBottomNav />}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
