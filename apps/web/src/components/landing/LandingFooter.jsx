import React from 'react';
import { Link } from 'react-router-dom';
import { Route } from 'lucide-react';

const LandingFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
                <Route className="h-4 w-4" />
              </span>
              <span className="font-extrabold text-foreground">
                ALIKA <span className="text-secondary">MOBILITY</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              La plateforme de gestion pour associations de transport en RDC : membres, paiements, cartes QR et rapports en un seul endroit.
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Powered by <span className="font-semibold text-foreground">ALIKA-KONNECT</span>
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
            <div>
              <p className="font-semibold text-foreground mb-3">Produit</p>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#fonctionnalites" className="hover:text-primary transition-colors">Fonctionnalités</a></li>
                <li><a href="#roles" className="hover:text-primary transition-colors">Rôles</a></li>
                <li><a href="#securite" className="hover:text-primary transition-colors">Sécurité</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-3">Accès</p>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/login" className="hover:text-primary transition-colors">Connexion</Link></li>
                <li><Link to="/signup" className="hover:text-primary transition-colors">Démo</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-3">Support</p>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="mailto:support@alika-konnect.com" className="hover:text-primary transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Confidentialité</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {year} Alika Mobility. Tous droits réservés.
          </p>
          <p className="text-xs text-muted-foreground">
            Fait pour les associations de transport en RDC 🇨🇩
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
