import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { AlertCircle } from 'lucide-react';

const LineForm = ({ initialData, onSubmit, submitLabel = 'Enregistrer', submitting = false }) => {
  const { currentUser } = useAuth();
  const [form, setForm] = useState({
    name: initialData?.name || '',
    departure: initialData?.departure || '',
    arrival: initialData?.arrival || '',
    distance_km: initialData?.distance_km || '',
    base_fare: initialData?.base_fare || '',
    status: initialData?.status || 'active',
    notes: initialData?.notes || '',
  });
  const [error, setError] = useState(null);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Le nom de la ligne est requis.'); return; }
    if (form.distance_km && (isNaN(form.distance_km) || Number(form.distance_km) < 0)) { setError('La distance doit être un nombre positif.'); return; }
    if (form.base_fare && (isNaN(form.base_fare) || Number(form.base_fare) < 0)) { setError('Le tarif doit être un nombre positif.'); return; }
    setError(null);
    onSubmit({ ...form, organization_id: currentUser?.organization_id });
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
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Nom *</label>
        <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Ex: Ligne 1 - Centre Ville"
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Point de Départ</label>
          <input type="text" value={form.departure} onChange={(e) => handleChange('departure', e.target.value)}
            placeholder="Ex: Marché Central"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Point d'Arrivée</label>
          <input type="text" value={form.arrival} onChange={(e) => handleChange('arrival', e.target.value)}
            placeholder="Ex: Gare Routière"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Distance (km)</label>
          <input type="number" value={form.distance_km} onChange={(e) => handleChange('distance_km', e.target.value)}
            placeholder="Ex: 15" min="0" step="0.1"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Tarif de Base (FC)</label>
          <input type="number" value={form.base_fare} onChange={(e) => handleChange('base_fare', e.target.value)}
            placeholder="Ex: 500" min="0"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Statut</label>
        <select value={form.status} onChange={(e) => handleChange('status', e.target.value)}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspendue</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Notes</label>
        <textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={3}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
          placeholder="Informations complémentaires..." />
      </div>

      <button type="submit" disabled={submitting}
        className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none">
        {submitting ? 'Enregistrement...' : submitLabel}
      </button>
    </form>
  );
};

export default LineForm;
