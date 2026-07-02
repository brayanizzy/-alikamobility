import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { NAV_ITEMS } from '@/config/navigation.js';
import { ChevronRight } from 'lucide-react';

const SidebarSection = ({ title, items, currentPath }) => (
  <div className="mb-4">
    {title && (
      <p className="px-3 mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
    )}
    <div className="space-y-0.5">
      {items.map((item) => {
        const isActive = currentPath === item.path || (
          item.path !== '/dashboard' && item.path !== '/agent' &&
          item.path !== '/super-admin' &&
          currentPath.startsWith(item.path) && item.path !== '/'
        );
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
              isActive
                ? 'bg-primary/15 text-primary font-semibold shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{item.label}</span>
            {item.path.includes('coming-soon') && (
              <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Bientôt
              </span>
            )}
          </Link>
        );
      })}
    </div>
  </div>
);

const AppSidebar = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const role = currentUser?.role;

  if (!currentUser) return null;

  if (role === 'super-admin') {
    return (
      <aside className={`${isOpen ? 'block' : 'hidden'} lg:block w-64 shrink-0 border-r border-border bg-card h-[calc(100vh-4rem)] overflow-y-auto sticky top-16`}>
        <div className="p-4">
          <SidebarSection title="Super Admin" items={NAV_ITEMS['super-admin']} currentPath={location.pathname} />
        </div>
      </aside>
    );
  }

  if (role === 'admin') {
    return (
      <aside className={`${isOpen ? 'block' : 'hidden'} lg:block w-64 shrink-0 border-r border-border bg-card h-[calc(100vh-4rem)] overflow-y-auto sticky top-16`}>
        <div className="p-4">
          <SidebarSection title="Général" items={NAV_ITEMS.admin.main} currentPath={location.pathname} />
          <SidebarSection title="Transport" items={NAV_ITEMS.admin.transport} currentPath={location.pathname} />
          <SidebarSection title="Finances" items={NAV_ITEMS.admin.finances} currentPath={location.pathname} />
        </div>
      </aside>
    );
  }

  return null;
};

export default AppSidebar;
