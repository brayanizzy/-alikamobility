import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header.jsx';
import { MODULE_LABELS } from '@/config/navigation.js';
import { Construction, ArrowLeft, LayoutDashboard } from 'lucide-react';

const ComingSoonPage = () => {
  const { module } = useParams();
  const navigate = useNavigate();
  const moduleName = MODULE_LABELS[module] || module?.replace(/-/g, ' ') || 'Module';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Construction className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2 capitalize">{moduleName}</h1>
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold mb-4">
              Module en préparation
            </span>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Ce module fait partie de la <strong>Version Terrain V1</strong> de ALIKA MOBILITY.
              Il sera activé progressivement dans les prochaines mises à jour.
            </p>
            <p className="text-sm text-muted-foreground mt-3">
              Restez connecté pour découvrir les nouvelles fonctionnalités.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-card border border-border text-foreground font-medium hover:bg-muted transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20"
            >
              <LayoutDashboard className="w-4 h-4" /> Tableau de bord
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ComingSoonPage;
