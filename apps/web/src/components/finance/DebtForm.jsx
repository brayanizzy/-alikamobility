import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { AlertCircle } from 'lucide-react';

const DEBT_TYPES = [
  { value: 'membership', label: 'Cotisation' },
  { value: 'penalty', label: 'Pénalité' },
  { value: 'loan', label: 'Prêt' },
  { value: 'other', label: 'Autre' },
];

const DEBT_STATUSES = ['active', 'paid', 'partially_paid', 'written_off'];
const CURRENCIES = ['CDF', 'USD'];

const DebtForm = ({ initialData, onSubmit, submitLabel = 'Enregistrer', submitting = false }) => {
  const { currentUser } = useAuth();
  const [form, setForm] = useState({
    member_id: initialData?.member_id || '',
    vehicle_id: initialData?.vehicle_id || '',
    debt_type: initialData?.debt_type || 'membership',
    amount_original: initialData?.amount_original || '',
    amount_remaining: initialData?.amount_remaining || '',
    currency: initialData?.currency || 'CDF',
    due_date: initialData?.due_date || '',
    status: initialData?.status || 'active',
    notes: initialData?.notes || '',
  });
  const [error, setError] = useState(null);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const orig = Number(form.amount_original);
    const rem = Number(form.amount_remaining);

    if (!form.amount_original || orig <= 0) { setError('Le montant initial est requis et doit être positif.'); return; }
    if (!form.amount_remaining || rem < 0) { setError('Le montant restant est requis et doit être positif ou nul.'); return; }
    if (rem > orig) { setError('Le montant restant ne peut pas dépasser le montant initial.'); return; }

    onSubmit({ ...form, amount_original: orig, amount_remaining: rem, organization_id: currentUser?.organization_id });
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
          placeholder="ID du membre (ex: abc123...)"
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Véhicule (optionnel)</label>
        <input type="text" value={form.vehicle_id} onChange={(e) => handleChange('vehicle_id', e.target.value)}
          placeholder="ID du véhicule"
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Type de Dette</label>
          <select value={form.debt_type} onChange={(e) => handleChange('debt_type', e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
            {DEBT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Devise</label>
          <select value={form.currency} onChange={(e) => handleChange('currency', e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Montant Initial *</label>
          <input type="number" value={form.amount_original} onChange={(e) => handleChange('amount_original', e.target.value)}
            placeholder="Ex: 50000" min="0" step="0.01"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Montant Restant *</label>
          <input type="number" value={form.amount_remaining} onChange={(e) => handleChange('amount_remaining', e.target.value)}
            placeholder="Ex: 50000" min="0" step="0.01"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Date d'Échéance</label>
          <input type="date" value={form.due_date} onChange={(e) => handleChange('due_date', e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Statut</label>
          <select value={form.status} onChange={(e) => handleChange('status', e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
            {DEBT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Notes</label>
        <textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={3}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
          placeholder="Commentaires..." />
      </div>

      <button type="submit" disabled={submitting}
        className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none">
        {submitting ? 'Enregistrement...' : submitLabel}
      </button>
    </form>
  );
};

export default DebtForm;
