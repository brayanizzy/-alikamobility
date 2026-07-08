import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import client from '@/lib/apiClient';

const ROLES = [
  { value: 'admin', label: 'Admin Association' },
  { value: 'field_collector', label: 'Agent Terrain' },
  { value: 'office_collector', label: 'Agent Caissier' },
];

const InviteUserForm = ({ onClose, onInvited }) => {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super-admin';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('field_collector');
  const [orgId, setOrgId] = useState('');
  const [parkingId, setParkingId] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [parkings, setParkings] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      client.collection('organizations').getList(1, 200)
        .then((r) => setOrganizations(r.items || []))
        .catch(() => {});
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    const targetOrg = isSuperAdmin ? orgId : (currentUser?.organization_id || '');
    if (targetOrg) {
      client.collection('parkings').getList(1, 100, { filter: `organization_id="${targetOrg}"` })
        .then((r) => setParkings(r.items || []))
        .catch(() => setParkings([]));
    } else {
      setParkings([]);
    }
  }, [orgId, isSuperAdmin, currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !role) { setError('Tous les champs obligatoires doivent être remplis.'); return; }
    if (isSuperAdmin && !orgId) { setError('Veuillez sélectionner une organisation.'); return; }

    setSubmitting(true);
    try {
      const body = { name, email, role };
      if (isSuperAdmin) body.organization_id = orgId;
      if (parkingId) body.parking_id = parkingId;
      const res = await client.request('/users/invite', { method: 'POST', body });
      onInvited(res);
      onClose();
    } catch (err) {
      setError(err?.response?.error || err?.message || 'Erreur lors de l\'invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Inviter un utilisateur</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Nom complet *</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full h-11 px-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Jean Mukendi"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Email *</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full h-11 px-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="jean@association.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Rôle *</label>
            <select
              value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {isSuperAdmin && <option value="admin">Admin Association</option>}
              <option value="field_collector">Agent Terrain</option>
              <option value="office_collector">Agent Caissier</option>
            </select>
          </div>

          {isSuperAdmin && (
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Organisation *</label>
              <select
                value={orgId} onChange={(e) => setOrgId(e.target.value)} required
                className="w-full h-11 px-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Sélectionner...</option>
                {organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          )}

          {parkings.length > 0 && (
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Parking (optionnel)</label>
              <select
                value={parkingId} onChange={(e) => setParkingId(e.target.value)}
                className="w-full h-11 px-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Aucun</option>
                {parkings.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-11 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition">
              Annuler
            </button>
            <button
              type="submit" disabled={submitting}
              className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-bold hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Envoyer l\'invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteUserForm;
