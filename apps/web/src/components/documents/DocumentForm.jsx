import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { AlertCircle, Upload } from 'lucide-react';

const RELATED_TYPES = [
  { value: 'vehicle', label: 'Véhicule' },
  { value: 'driver', label: 'Chauffeur' },
  { value: 'member', label: 'Membre' },
  { value: 'owner', label: 'Propriétaire' },
];

const DocumentForm = ({ initialData, onSubmit, submitLabel = 'Enregistrer', submitting = false, preselectType = '', preselectId = '' }) => {
  const { currentUser } = useAuth();
  const [form, setForm] = useState({
    related_type: preselectType || initialData?.related_type || '',
    related_id: preselectId || initialData?.related_id || '',
    document_type: initialData?.document_type || '',
    label: initialData?.label || '',
    expiry_date: initialData?.expiry_date || '',
    status: initialData?.status || 'active',
    notes: initialData?.notes || '',
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.related_type) {
      setError('Veuillez sélectionner un type d\'entité liée.');
      return;
    }
    if (!form.related_id) {
      setError('Veuillez sélectionner l\'élément concerné.');
      return;
    }
    if (!form.document_type) {
      setError('Veuillez préciser le type de document.');
      return;
    }
    setError(null);
    const formData = { ...form, organization_id: currentUser?.organization_id };
    if (file) formData.file = file;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Type d'Entité</label>
          <select value={form.related_type} onChange={(e) => { handleChange('related_type', e.target.value); handleChange('related_id', ''); }}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
            <option value="">Sélectionner...</option>
            {RELATED_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">ID de l'Élément</label>
          <input type="text" value={form.related_id} onChange={(e) => handleChange('related_id', e.target.value)}
            placeholder="ID de l'élément lié"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
          {!form.related_id && preselectId && <p className="text-xs text-muted-foreground mt-1">ID pré-rempli depuis la page précédente</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Type de Document</label>
          <input type="text" value={form.document_type} onChange={(e) => handleChange('document_type', e.target.value)}
            placeholder="Ex: Carte grise, Assurance, Permis"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Libellé</label>
          <input type="text" value={form.label} onChange={(e) => handleChange('label', e.target.value)}
            placeholder="Ex: Carte grise Toyota Corolla"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Date d'Expiration</label>
          <input type="date" value={form.expiry_date} onChange={(e) => handleChange('expiry_date', e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Statut</label>
          <select value={form.status} onChange={(e) => handleChange('status', e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
            <option value="active">Valide</option>
            <option value="expired">Expiré</option>
            <option value="pending">En attente</option>
            <option value="rejected">Rejeté</option>
            <option value="archived">Archivé</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Fichier</label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 bg-background border border-border rounded-xl px-4 py-3 cursor-pointer hover:bg-muted/30 transition-all text-sm text-muted-foreground">
            <Upload className="w-4 h-4" />
            <span>{file ? file.name : 'Choisir un fichier'}</span>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
          </label>
          {file && (
            <button type="button" onClick={() => setFile(null)} className="text-xs text-destructive hover:text-destructive/80 transition-colors">
              Retirer
            </button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Formats: JPG, PNG, PDF (max 5 Mo)</p>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Notes</label>
        <textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={3}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
          placeholder="Notes additionnelles..." />
      </div>

      <button type="submit" disabled={submitting}
        className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none">
        {submitting ? 'Enregistrement...' : submitLabel}
      </button>
    </form>
  );
};

export default DocumentForm;
