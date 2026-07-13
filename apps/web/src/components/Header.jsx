
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useTheme } from 'next-themes';
import { NAV_ITEMS } from '@/config/navigation.js';
import { LogOut, LayoutDashboard, Menu, Sun, Moon } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell.jsx';
import MobileMenu from '@/components/MobileMenu.jsx';
import AppBreadcrumb from '@/components/AppBreadcrumb.jsx';
import { AGENT_TYPE_LABELS } from '@/utils/roles.js';

const Header = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

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

  const navLinkClass = (path) => `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
    isActive(path) 
      ? 'bg-primary/20 text-primary font-semibold' 
      : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium'
  }`;

  const getDesktopNavItems = () => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') {
      return NAV_ITEMS.admin.main.slice(0, 6);
    }
    return [];
  };

  return (
    <>
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm shadow-black/20">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img src="/assets/images/logo.png" alt="Alika Mobility" className="h-9 w-auto rounded-lg border border-border/30 shadow-sm" />
            <span className="font-bold text-xl tracking-tight text-foreground hidden sm:block">
              Alika <span className="text-secondary">Mobility</span>
            </span>
          </Link>
          {isAuthenticated && (
            <div className="hidden lg:block">
              <AppBreadcrumb />
            </div>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium px-3 py-2">
                Accueil
              </Link>
              <Link to="/register-association" className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" /> Créer mon association
              </Link>
              <Link to="/login" className="px-5 py-2.5 rounded-lg bg-muted text-foreground font-bold text-sm hover:bg-muted/80 transition-all flex items-center gap-2">
                <LogOut className="w-4 h-4 rotate-180" /> Connexion
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {currentUser.role === 'admin' && getDesktopNavItems().map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} to={item.path} className={navLinkClass(item.path)}>
                    <Icon className="w-4 h-4" /> {item.label}
                  </Link>
                );
              })}

              {currentUser.role === 'agent' && (
                <>
                  <Link to="/agent" className={navLinkClass('/agent')}>
                    <LayoutDashboard className="w-4 h-4" /> Accueil
                  </Link>
                  <Link to="/scanner" className={navLinkClass('/scanner')}>
                    <LayoutDashboard className="w-4 h-4" /> Scanner
                  </Link>
                  <Link to="/payment-history" className={navLinkClass('/payment-history')}>
                    <LayoutDashboard className="w-4 h-4" /> Historique
                  </Link>
                </>
              )}
              
              <NotificationBell />

              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-xl bg-card hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-all"
                  aria-label="Changer le thème"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}
              
              <div className="h-6 w-px bg-border mx-1"></div>
              
              <div className="flex items-center gap-2 ml-1">
                <div className="flex flex-col items-end leading-tight">
                  <span className="text-sm font-bold text-foreground">{currentUser.name || currentUser.email?.split('@')[0]}</span>
                  <span className="text-[11px] text-secondary font-medium">
                    {currentUser.role === 'agent' ? AGENT_TYPE_LABELS[currentUser.agent_type] || 'Récupérateur terrain' : 
                     currentUser.role === 'admin' ? 'Administrateur' :
                     currentUser.role === 'super-admin' ? 'Super Admin' : currentUser.role}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-card hover:bg-destructive/20 border border-border hover:border-destructive/30 text-muted-foreground hover:text-destructive transition-all"
                  aria-label="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-2">
          {isAuthenticated && (
            <>
              <NotificationBell />
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
                aria-label="Menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>

    <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} onLogout={handleLogout} />
  </>
  );
};

export default Header;
