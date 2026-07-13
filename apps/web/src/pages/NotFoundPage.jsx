import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { ArrowLeft, LayoutDashboard, Home } from 'lucide-react';

const NotFoundPage = () => {
  const { isAuthenticated, currentUser } = useAuth();

  const dashboardLink = () => {
    if (!isAuthenticated || !currentUser) return '/';
    const role = currentUser.role;
    if (role === 'super-admin') return '/super-admin';
    if (role === 'admin') return '/dashboard';
    if (role === 'agent') return '/agent';
    return '/';
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-7xl font-black text-muted-foreground/20 mb-4">404</div>
        <h1 className="text-2xl font-bold mb-2">Page introuvable</h1>
        <p className="text-muted-foreground mb-8">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={dashboardLink()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            {isAuthenticated ? 'Tableau de bord' : 'Accueil'}
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-muted text-foreground font-semibold hover:bg-muted/80 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Connexion
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
