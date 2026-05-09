
import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import OnlineStatusIndicator from './components/OnlineStatusIndicator.jsx';

// Pages
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import ParkingsPage from './pages/ParkingsPage.jsx';

// Super Admin
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';

// Admin
import AdminAssociationDashboard from './pages/AdminAssociationDashboard.jsx';
import MembersPage from './pages/MembersPage.jsx';
import AgentsPage from './pages/AgentsPage.jsx';

// Agent / Recouvreur
import AgentDashboard from './pages/AgentDashboard.jsx';
import ScannerPage from './pages/ScannerPage.jsx';
import PaymentHistoryPage from './pages/PaymentHistoryPage.jsx';
import MembersListPage from './pages/MembersListPage.jsx';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <OnlineStatusIndicator />
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Super-Admin Routes */}
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
            path="/parkings" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ParkingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/members" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
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
            path="/payment-history" 
            element={
              <ProtectedRoute allowedRoles={['agent']}>
                <PaymentHistoryPage />
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

          {/* Fallback 404 */}
          <Route path="*" element={
            <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
              <h1 className="text-5xl font-extrabold text-primary mb-4">404</h1>
              <p className="text-xl mb-8">Page non trouvée</p>
              <a href="/" className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Retour à l'accueil</a>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
