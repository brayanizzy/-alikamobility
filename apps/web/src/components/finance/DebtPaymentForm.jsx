import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { AlertCircle, Loader2 } from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank', label: 'Banque' },
  { value: 'other', label: 'Autre' },
];

const DebtPaymentForm = ({ debt, onSubmit, submitting = false, onCancel }) => {
  const { currentUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [error, setError] = useState(null);

  const remaining = Number(debt?.amount_remaining || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const paid = Number(amount);
    if (!amount || paid <= 0) { setError('Le montant payé est requis et doit être positif.'); return; }
    if (paid > remaining) { setError(`Le montant payé (${paid}) ne peut pas dépasser le montant restant (${remaining}).`); return; }
    if (!method) { setError('La méthode de paiement est requise.'); return; }
    onSubmit({ amount: paid, payment_method: method });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      <div className="bg-muted/30 rounded-xl p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Montant Restant</p>
        <p className="text-2xl font-extrabold text-foreground">{Number(remaining).toLocaleString()} {debt?.currency || 'CDF'}</p>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Montant Payé *</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="Ex: 25000" min="0" max={remaining} step="0.01"
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Méthode de Paiement *</label>
        <select value={method} onChange={(e) => setMethod(e.target.value)}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
          {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-muted text-foreground font-bold hover:bg-muted/80 transition-all">
          Annuler
        </button>
        <button type="submit" disabled={submitting}
          className="flex-[2] py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2">
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Traitement...</> : 'Payer'}
        </button>
      </div>
    </form>
  );
};

export default DebtPaymentForm;
