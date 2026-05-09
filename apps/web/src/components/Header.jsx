
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { LogOut, LayoutDashboard, Users, CreditCard, ScanLine, Menu, X, ChevronRight } from 'lucide-react';

const Header = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!currentUser) return '/';
    switch (currentUser.role) {
      case 'super-admin': return '/super-admin';
      case 'admin': return '/dashboard';
      case 'agent': return '/agent';
      default: return '/';
    }
  };

  const isActive = (path) => location.pathname === path;
  
  const navLinkClass = (path) => `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
    isActive(path) 
      ? 'bg-primary/20 text-primary font-semibold' 
      : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium'
  }`;

  // Breadcrumb generator
  const getBreadcrumb = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length === 0 || paths[0] === '') return null;
    
    return (
      <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground ml-6 bg-card border border-border px-3 py-1 rounded-full">
        <Link to={getDashboardLink()} className="hover:text-primary transition-colors">Portail</Link>
        {paths.map((p, idx) => {
          // Skip if it's the root dashboard equivalent
          if (p === 'dashboard' || p === 'super-admin' || p === 'agent') return null;
          return (
            <React.Fragment key={p}>
              <ChevronRight className="w-3 h-3" />
              <span className="capitalize text-foreground font-medium">{p.replace('-', ' ')}</span>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm shadow-black/20">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="font-bold text-primary-foreground text-lg">A</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground hidden sm:block">
              Alika <span className="text-secondary">Mobility</span>
            </span>
          </Link>
          {isAuthenticated && getBreadcrumb()}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {!isAuthenticated ? (
            <Link 
              to="/login" 
              className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-sm transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
            >
              Connexion
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link to={getDashboardLink()} className={navLinkClass(getDashboardLink())}>
                <LayoutDashboard className="w-4 h-4" /> Accueil
              </Link>
              
              {currentUser.role === 'admin' && (
                <>
                  <Link to="/members" className={navLinkClass('/members')}>
                    <Users className="w-4 h-4" /> Membres
                  </Link>
                </>
              )}

              {currentUser.role === 'agent' && (
                <>
                  <Link to="/scanner" className={navLinkClass('/scanner')}>
                    <ScanLine className="w-4 h-4" /> Scanner
                  </Link>
                  <Link to="/payment-history" className={navLinkClass('/payment-history')}>
                    <CreditCard className="w-4 h-4" /> Historique
                  </Link>
                  <Link to="/members-list" className={navLinkClass('/members-list')}>
                    <Users className="w-4 h-4" /> Membres
                  </Link>
                </>
              )}
              
              <div className="h-6 w-px bg-border mx-2"></div>
              
              <div className="flex items-center gap-3 ml-2">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-foreground leading-none">{currentUser.name || currentUser.email.split('@')[0]}</span>
                  <span className="text-xs text-secondary capitalize mt-1 font-medium">{currentUser.role}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-card hover:bg-destructive/20 border border-border hover:border-destructive/30 text-muted-foreground hover:text-destructive transition-all"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center">
          {isAuthenticated && (
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-foreground"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && isAuthenticated && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-card border-b border-border shadow-xl py-4 px-4 flex flex-col gap-2 z-50">
          <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)} className={navLinkClass(getDashboardLink())}>
            <LayoutDashboard className="w-5 h-5" /> Accueil
          </Link>
          
          {currentUser.role === 'admin' && (
            <Link to="/members" onClick={() => setMobileMenuOpen(false)} className={navLinkClass('/members')}>
              <Users className="w-5 h-5" /> Gestion des Membres
            </Link>
          )}

          {currentUser.role === 'agent' && (
            <>
              <Link to="/scanner" onClick={() => setMobileMenuOpen(false)} className={navLinkClass('/scanner')}>
                <ScanLine className="w-5 h-5" /> Scanner QR
              </Link>
              <Link to="/payment-history" onClick={() => setMobileMenuOpen(false)} className={navLinkClass('/payment-history')}>
                <CreditCard className="w-5 h-5" /> Historique Paiements
              </Link>
              <Link to="/members-list" onClick={() => setMobileMenuOpen(false)} className={navLinkClass('/members-list')}>
                <Users className="w-5 h-5" /> Mes Membres
              </Link>
            </>
          )}
          
          <div className="h-px bg-border my-2"></div>
          <button 
            onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
            className="flex items-center gap-3 px-3 py-3 text-destructive font-medium rounded-lg hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" /> Déconnexion
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
