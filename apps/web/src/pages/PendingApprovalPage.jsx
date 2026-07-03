import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const PendingApprovalPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-xl p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-4">
          Inscription en attente de validation
        </h1>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          Votre compte a bien été créé. Il doit maintenant être validé par
          l'équipe d'administration avant activation.
        </p>

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
