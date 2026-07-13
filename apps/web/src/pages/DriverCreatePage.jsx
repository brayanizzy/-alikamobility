import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import MemberSelector from '@/components/people/MemberSelector.jsx';
import VehicleSelector from '@/components/transport/VehicleSelector.jsx';
import LineSelector from '@/components/transport/LineSelector.jsx';
import { Loader2, AlertCircle, ArrowLeft, Save, UserCircle, Truck, Route } from 'lucide-react';
import { toast } from 'sonner';

const DriverCreatePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [form, setForm] = useState({
    license_number: '',
    license_category: 'B',
    license_expiry: '',
    medical_cert_expiry: '',
    status: 'active',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember) {
      toast.error('Veuillez sélectionner un membre.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const existing = await pb.collection('drivers').getList(1, 1, {
        filter: `member_id = "${selectedMember.id}" && organization_id = "${currentUser?.organization_id}"`,
        $autoCancel: false,
      });
      if (existing.totalItems > 0) {
        throw new Error('Ce membre est déjà enregistré comme chauffeur.');
      }

      const orgId = currentUser.organization_id;
      const data = {
        organization_id: orgId,
        member_id: selectedMember.id,
        license_number: form.license_number || null,
        license_category: form.license_category || null,
        license_expiry: form.license_expiry || null,
        medical_cert_expiry: form.medical_cert_expiry || null,
        status: form.status,
        notes: form.notes || null,
      };

      const driver = await pb.collection('drivers').create(data, { $autoCancel: false });

      if (selectedVehicle || selectedLine) {
        await pb.collection('vehicle_assignments').create({
          organization_id: orgId,
          vehicle_id: selectedVehicle?.id || null,
          driver_id: driver.id,
          line_id: selectedLine?.id || null,
          start_date: new Date().toISOString().split('T')[0],
          status: 'active',
        }, { $autoCancel: false });
      }

      toast.success('Chauffeur créé avec succès !');
      navigate('/drivers');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Erreur lors de la création';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => navigate('/drivers')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Retour aux chauffeurs
            </button>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Ajouter un Chauffeur</h1>
                  <p className="text-sm text-muted-foreground">Lier un membre existant à un profil chauffeur.</p>
                </div>
              </div>

              {error && (
                <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-destructive">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Member Selection */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    Membre * <span className="text-destructive">(obligatoire)</span>
                  </label>
                  <MemberSelector
                    onSelect={setSelectedMember}
                    selectedMember={selectedMember}
                    placeholder="Rechercher un membre par nom, téléphone ou code..."
                  />
                  {selectedMember && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{selectedMember.name}</span>
                      {selectedMember.code_member && <code className="text-primary">{selectedMember.code_member}</code>}
                      {selectedMember.phone && <span>• {selectedMember.phone}</span>}
                    </div>
                  )}
                </div>

                {/* License Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Numéro de Permis</label>
                    <input type="text" value={form.license_number} onChange={(e) => handleChange('license_number', e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      placeholder="Ex: 12345678" />
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

                {/* Dates */}
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

                {/* Status */}
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

                {/* Assignment — Vehicle */}
                <div className="border-t border-border pt-6">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Assigner un Véhicule <span className="text-[10px] font-normal lowercase text-muted-foreground">(optionnel)</span>
                  </h3>
                  <VehicleSelector
                    onSelect={setSelectedVehicle}
                    selectedVehicle={selectedVehicle}
                    placeholder="Rechercher un véhicule par plaque ou marque..."
                  />
                </div>

                {/* Assignment — Line */}
                <div className="pb-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Route className="w-4 h-4" /> Assigner une Ligne <span className="text-[10px] font-normal lowercase text-muted-foreground">(optionnel)</span>
                  </h3>
                  <LineSelector
                    onSelect={setSelectedLine}
                    selectedLine={selectedLine}
                    placeholder="Rechercher une ligne par nom..."
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Notes</label>
                  <textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={3}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                    placeholder="Informations complémentaires..." />
                </div>

                <button type="submit" disabled={submitting || !selectedMember}
                  className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {submitting ? 'Création en cours...' : 'Créer le Chauffeur'}
                </button>
              </form>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DriverCreatePage;
