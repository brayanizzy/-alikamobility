import React from 'react';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import MobileBottomNav from '@/components/MobileBottomNav.jsx';
import AppBreadcrumb from '@/components/AppBreadcrumb.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';

const AppLayout = ({ children, showSidebar = true, showBreadcrumb = true, className = '' }) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1">
        {isAuthenticated && showSidebar && <AppSidebar />}
        <main className={`flex-1 flex flex-col ${className}`}>
          {isAuthenticated && showBreadcrumb && (
            <div className="px-4 sm:px-6 pt-4 pb-0">
              <AppBreadcrumb />
            </div>
          )}
          <div className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
      {isAuthenticated && <MobileBottomNav />}
    </div>
  );
};

export default AppLayout;
