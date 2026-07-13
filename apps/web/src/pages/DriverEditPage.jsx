import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import { Loader2, AlertCircle, ArrowLeft, Save, UserCircle } from 'lucide-react';
import { toast } from 'sonner';

const DriverEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    license_number: '',
    license_category: 'B',
    license_expiry: '',
    medical_cert_expiry: '',
    status: 'active',
    notes: '',
  });
  const [memberName, setMemberName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDriver = async () => {
      try {
        const d = await pb.collection('drivers').getOne(id, { $autoCancel: false });
        setForm({
          license_number: d.license_number || '',
          license_category: d.license_category || 'B',
          license_expiry: d.license_expiry || '',
          medical_cert_expiry: d.medical_cert_expiry || '',
          status: d.status || 'active',
          notes: d.notes || '',
        });
        if (d.member_id) {
          const m = await pb.collection('members').getOne(d.member_id, { $autoCancel: false });
          setMemberName(m.name || '');
        }
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les données du chauffeur.');
      } finally {
        setLoading(false);
      }
    };
    fetchDriver();
  }, [id]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await pb.collection('drivers').update(id, {
        license_number: form.license_number || null,
        license_category: form.license_category || null,
        license_expiry: form.license_expiry || null,
        medical_cert_expiry: form.medical_cert_expiry || null,
        status: form.status,
        notes: form.notes || null,
      }, { $autoCancel: false });
      toast.success('Chauffeur modifié avec succès !');
      navigate(`/drivers/${id}`);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Erreur lors de la modification';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
        <Header /><div className="flex-1 flex"><AppSidebar /><main className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></main></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => navigate(`/drivers/${id}`)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Retour au chauffeur
            </button>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Modifier le Chauffeur</h1>
                  {memberName && <p className="text-sm text-muted-foreground">{memberName}</p>}
                </div>
              </div>

              {error && (
                <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-destructive">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Numéro de Permis</label>
                    <input type="text" value={form.license_number} onChange={(e) => handleChange('license_number', e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Catégorie Permis</label>
                    <select value={form.license_category} onChange={(e) => handleChange('license_category', e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
                      <option value="A">A — Moto</option>
                      <option value="B">B — Voiture légère</option>
                      <option value="C">C — Camion</option>
                      <option value="D">D — Bus / transport de personnes</option>
                      <option value="E">E — Remorque / catégorie spéciale</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Expiration Permis</label>
                    <input type="date" value={form.license_expiry} onChange={(e) => handleChange('license_expiry', e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Expiration Certificat Médical</label>
                    <input type="date" value={form.medical_cert_expiry} onChange={(e) => handleChange('medical_cert_expiry', e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Statut</label>
                  <select value={form.status} onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
                    <option value="active">Actif</option>
                    <option value="suspended">Suspendu</option>
                    <option value="inactive">Inactif</option>
                    <option value="expired">Expiré</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Notes</label>
                  <textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={3}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none" />
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {submitting ? 'Enregistrement...' : 'Enregistrer les Modifications'}
                </button>
              </form>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DriverEditPage;
