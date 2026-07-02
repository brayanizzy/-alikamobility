import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { AlertCircle } from 'lucide-react';

const PENALTY_TYPES = [
  { value: 'late_payment', label: 'Retard de paiement' },
  { value: 'overcharge', label: 'Surfacturation' },
  { value: 'damage', label: 'Dommage' },
  { value: 'other', label: 'Autre' },
];

const PENALTY_STATUSES = ['pending', 'applied', 'waived', 'paid'];

const PenaltyForm = ({ initialData, onSubmit, submitLabel = 'Enregistrer', submitting = false }) => {
  const { currentUser } = useAuth();
  const [form, setForm] = useState({
    member_id: initialData?.member_id || '',
    debt_id: initialData?.debt_id || '',
    payment_id: initialData?.payment_id || '',
    amount: initialData?.amount || '',
    currency: initialData?.currency || 'CDF',
    reason: initialData?.reason || '',
    penalty_type: initialData?.penalty_type || 'late_payment',
    status: initialData?.status || 'pending',
    notes: initialData?.notes || '',
  });
  const [error, setError] = useState(null);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const amt = Number(form.amount);
    if (!form.amount || amt <= 0) { setError('Le montant est requis et doit être positif.'); return; }
    if (!form.reason.trim()) { setError('La raison est requise.'); return; }
    onSubmit({ ...form, amount: amt, organization_id: currentUser?.organization_id });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Membre</label>
        <input type="text" value={form.member_id} onChange={(e) => handleChange('member_id', e.target.value)}
          placeholder="ID du membre"
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Dette liée (optionnelle)</label>
          <input type="text" value={form.debt_id} onChange={(e) => handleChange('debt_id', e.target.value)}
            placeholder="ID de la dette"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Paiement lié (optionnel)</label>
          <input type="text" value={form.payment_id} onChange={(e) => handleChange('payment_id', e.target.value)}
            placeholder="ID du paiement"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Montant *</label>
          <input type="number" value={form.amount} onChange={(e) => handleChange('amount', e.target.value)}
            placeholder="Ex: 5000" min="0" step="0.01"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Devise</label>
          <select value={form.currency} onChange={(e) => handleChange('currency', e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
            <option value="CDF">CDF</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Type de Pénalité</label>
        <select value={form.penalty_type} onChange={(e) => handleChange('penalty_type', e.target.value)}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
          {PENALTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Raison *</label>
        <textarea value={form.reason} onChange={(e) => handleChange('reason', e.target.value)} rows={2}
          placeholder="Motif de la pénalité"
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Statut</label>
          <select value={form.status} onChange={(e) => handleChange('status', e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
            {PENALTY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Notes</label>
        <textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={3}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none" />
      </div>

      <button type="submit" disabled={submitting}
        className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none">
        {submitting ? 'Enregistrement...' : submitLabel}
      </button>
    </form>
  );
};

export default PenaltyForm;
