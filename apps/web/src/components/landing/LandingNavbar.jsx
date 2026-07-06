import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Route, Menu, X, ArrowRight, LayoutDashboard } from 'lucide-react';

const ANCHOR_LINKS = [
  { href: '#fonctionnalites', label: 'Fonctionnalités' },
  { href: '#roles', label: 'Rôles' },
  { href: '#securite', label: 'Sécurité' },
  { href: '#comment-ca-marche', label: 'Comment ça marche' },
];

const getDashboardLink = (currentUser) => {
  if (!currentUser) return '/';
  switch (currentUser.role) {
    case 'super-admin': return '/super-admin';
    case 'admin': return '/dashboard';
    case 'agent': return '/agent';
    default: return '/';
  }
};

const LandingNavbar = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="Alika Mobility - Accueil">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-primary-foreground shadow-md shadow-primary/20">
            <Route className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-extrabold text-lg tracking-tight text-foreground">
              ALIKA <span className="text-secondary">MOBILITY</span>
            </span>
            <span className="hidden sm:block text-[11px] font-medium text-muted-foreground tracking-wide">
              Transport Management Platform
            </span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Navigation principale">
          {ANCHOR_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to={getDashboardLink(currentUser)}
              className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" /> Aller au tableau de bord
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Se connecter
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center gap-2"
              >
                Demander une démo <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background px-4 py-4 space-y-1 animate-slide-down">
          {ANCHOR_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 flex flex-col gap-2 border-t border-border/60 mt-2">
            {isAuthenticated ? (
              <Link
                to={getDashboardLink(currentUser)}
                onClick={() => setOpen(false)}
                className="w-full text-center px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" /> Aller au tableau de bord
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-lg bg-muted text-foreground font-semibold text-sm"
                >
                  Se connecter
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="w-full text-center px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2"
                >
                  Demander une démo <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingNavbar;
