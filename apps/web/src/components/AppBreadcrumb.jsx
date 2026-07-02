import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { ChevronRight, LayoutDashboard } from 'lucide-react';

const ROUTE_LABELS = {
  dashboard: 'Tableau de bord',
  'super-admin': 'Super Admin',
  agent: 'Agent',
  members: 'Membres',
  parkings: 'Parkings',
  agents: 'Agents',
  reports: 'Rapports',
  scanner: 'Scanner QR',
  'payment-history': 'Historique paiements',
  payments: 'Paiements',
  'late-payments': 'Paiements en retard',
  'members-list': 'Membres',
  notifications: 'Notifications',
  profile: 'Profil',
  'coming-soon': 'En préparation',
};

const AppBreadcrumb = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const paths = location.pathname.split('/').filter(Boolean);

  if (paths.length === 0 || !currentUser) return null;

  const getDashboardLink = () => {
    switch (currentUser.role) {
      case 'super-admin': return '/super-admin';
      case 'admin': return '/dashboard';
      case 'agent': return '/agent';
      default: return '/';
    }
  };

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link to={getDashboardLink()} className="hover:text-primary transition-colors font-medium flex items-center gap-1">
        <LayoutDashboard className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Accueil</span>
      </Link>
      {paths.map((p, idx) => {
        if (p === 'dashboard' || p === 'super-admin' || p === 'agent' || p === 'coming-soon') return null;
        const label = ROUTE_LABELS[p] || p.replace(/-/g, ' ');
        return (
          <React.Fragment key={p}>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-foreground font-medium capitalize truncate max-w-[120px] sm:max-w-[200px]">
              {label}
            </span>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default AppBreadcrumb;
