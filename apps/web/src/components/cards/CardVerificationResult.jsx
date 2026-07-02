import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, User, CreditCard, Calendar, Shield } from 'lucide-react';

const CardVerificationResult = ({ result, loading, error }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-lg font-bold text-foreground">Vérification en cours...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <XCircle className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-destructive mb-2">Carte invalide</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center text-center py-8">
        <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-muted-foreground" />
        </div>
        <p className="text-lg font-bold text-foreground">Scannez ou saisissez un code carte</p>
        <p className="text-sm text-muted-foreground mt-2">Entrez le numéro de carte membre pour vérifier</p>
      </div>
    );
  }

  const isValid = result.card?.status === 'active' && result.success !== false;
  const hasDebt = result.openDebt && parseFloat(result.openDebt.amount_remaining) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isValid ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
          {isValid ? (
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          ) : (
            <XCircle className="w-10 h-10 text-destructive" />
          )}
        </div>
        <h2 className={`text-2xl font-bold ${isValid ? 'text-emerald-500' : 'text-destructive'}`}>
          {isValid ? 'Carte valide' : 'Carte invalide'}
        </h2>
        <p className="text-sm text-muted-foreground">{result.card?.card_number}</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Membre</p>
            <p className="text-lg font-bold text-foreground">{result.member?.name || 'Inconnu'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Type de carte</p>
            <p className="font-bold text-foreground capitalize">{result.card?.card_type}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Statut</p>
            <p className={`font-bold capitalize ${isValid ? 'text-emerald-500' : 'text-destructive'}`}>
              {result.card?.status}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Date d'émission</p>
            <p className="font-semibold text-foreground">{result.card?.issued_date}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Expiration</p>
            <p className="font-semibold text-foreground">{result.card?.expiry_date || 'Aucune'}</p>
          </div>
        </div>

        {(result.member?.member_code || result.member?.phone) && (
          <div className="pt-3 border-t border-border space-y-2">
            {result.member?.member_code && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Code membre</span>
                <span className="font-mono text-sm font-bold text-foreground">{result.member.member_code}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {result.openDebt && (
        <div className={`rounded-2xl p-4 flex items-start gap-3 ${hasDebt ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
          <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${hasDebt ? 'text-amber-500' : 'text-emerald-500'}`} />
          <div>
            <p className={`font-bold text-sm ${hasDebt ? 'text-amber-600' : 'text-emerald-600'}`}>
              {hasDebt ? 'Dette en cours' : 'Aucune dette ouverte'}
            </p>
            {hasDebt && (
              <p className="text-sm text-muted-foreground mt-1">
                Montant restant : {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(result.openDebt.amount_remaining)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CardVerificationResult;
