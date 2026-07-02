import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { formatCurrency } from '@/utils/currency.js';
import {
  isOnline, queueMutation, getMembersFromDB, getParkingsFromDB,
  syncMembersToDB, syncParkingsToDB, generateClientPaymentId,
} from '@/utils/OfflineService.js';
import {
  Loader2, CheckCircle2, AlertCircle, Users, DollarSign, Smartphone,
  Landmark, MapPin, FileText, ArrowLeft, Search, Banknote,
} from 'lucide-react';
import { toast } from 'sonner';

const OfflinePaymentPage = () => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState('select'); // select | form | confirm
  const [members, setMembers] = useState([]);
  const [parkings, setParkings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'Espèces',
    parking_id: '',
    notes: '',
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const online = isOnline();
        let memberList = [];
        let parkingList = [];

        if (online) {
          try {
            const orgId = currentUser.organization_id;
            const membersRes = await pb.collection('members').getList(1, 200, {
              filter: `organization_id = "${orgId}" && status = "active"`,
              sort: 'name', $autoCancel: false,
            });
            memberList = membersRes.items || [];
            await syncMembersToDB(memberList);

            const parkingsRes = await pb.collection('parkings').getFullList({
              filter: `organization_id = "${orgId}"`, $autoCancel: false,
            });
            parkingList = parkingsRes || [];
            await syncParkingsToDB(parkingList);
          } catch (e) {
            const [cachedMembers, cachedParkings] = await Promise.all([
              getMembersFromDB(currentUser.organization_id),
              getParkingsFromDB(),
            ]);
            memberList = cachedMembers;
            parkingList = cachedParkings;
          }
        } else {
          memberList = await getMembersFromDB(currentUser.organization_id);
          parkingList = await getParkingsFromDB();
        }

        setMembers(memberList);
        setParkings(parkingList);
      } catch (e) {
        console.error('Failed to load data:', e);
        toast.error('Impossible de charger les données');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser]);

  const filteredMembers = searchQuery
    ? members.filter(m =>
        (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.member_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.moto_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.phone || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : members;

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setStep('form');
    setFormData(prev => ({
      ...prev,
      parking_id: member.parking_id || currentUser.parking_id || '',
    }));
  };

  const validateForm = () => {
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Montant invalide');
      return false;
    }
    return true;
  };

  const handleSaveOffline = async () => {
    if (submitLockRef.current || submitting) return;
    if (!validateForm()) return;

    submitLockRef.current = true;
    setSubmitting(true);

    try {
      const clientPaymentId = generateClientPaymentId(currentUser.id, selectedMember.id);
      const offlinePayment = {
        organization_id: currentUser.organization_id,
        member_id: selectedMember.id,
        amount: Number(formData.amount),
        payment_date: new Date().toISOString(),
        payment_method: formData.payment_method,
        notes: formData.notes || '',
        status: 'paid',
        recorded_by: currentUser.name || currentUser.email,
        collector_id: currentUser.id,
        parking_id: formData.parking_id || currentUser.parking_id || selectedMember.parking_id || '',
        device_id: currentUser.device_id || '',
        offline_sync: true,
        client_payment_id: clientPaymentId,
        id: crypto.randomUUID(),
      };

      await queueMutation('payments', 'create', offlinePayment);
      toast.success('Paiement enregistré hors ligne');
      setStep('confirm');
    } catch (e) {
      console.error('Failed to save offline payment:', e);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
    }
  };

  const resetAll = () => {
    setStep('select');
    setSelectedMember(null);
    setFormData({ amount: '', payment_method: 'Espèces', parking_id: '', notes: '' });
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <Header />
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {step === 'select' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-extrabold text-foreground">Paiement hors ligne</h1>
            </div>

            {!isOnline() && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 text-sm font-medium mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Mode hors ligne : seuls les membres déjà synchronisés sont disponibles
              </div>
            )}

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un membre..."
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            {/* Member list */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {filteredMembers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">Aucun membre trouvé</p>
                  {!isOnline() && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Connectez-vous pour synchroniser les membres
                    </p>
                  )}
                </div>
              )}
              {filteredMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleSelectMember(member)}
                  className="w-full text-left bg-card border border-border rounded-xl p-4 hover:bg-muted/50 active:scale-[0.98] transition-all flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-bold text-primary">{member.name?.charAt(0) || '?'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-foreground block truncate">{member.name}</span>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {member.member_code && <span className="font-mono">{member.member_code}</span>}
                      {member.moto_number && <span>{member.moto_number}</span>}
                    </div>
                  </div>
                  <DollarSign className="w-5 h-5 text-primary shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'form' && selectedMember && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <button onClick={() => setStep('select')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>

            <h2 className="text-xl font-extrabold text-foreground mb-6">Enregistrer un paiement</h2>

            {/* Member info */}
            <div className="bg-card border border-border rounded-xl p-4 mb-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-primary">{selectedMember.name?.charAt(0)}</span>
              </div>
              <div>
                <span className="font-bold text-foreground block">{selectedMember.name}</span>
                <span className="text-xs text-muted-foreground">{selectedMember.member_code || selectedMember.moto_number || ''}</span>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1 mb-4">
              <label className="text-sm font-medium text-muted-foreground">Montant (FC) *</label>
              <div className="relative">
                <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <input
                  type="number" min="1"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full h-14 pl-12 pr-4 rounded-xl bg-input border border-border text-foreground font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="5000"
                />
              </div>
              {formData.amount && (
                <p className="text-xs text-muted-foreground mt-1">
                  A encaisser: <span className="font-bold text-foreground">{formatCurrency(formData.amount)}</span>
                </p>
              )}
            </div>

            {/* Payment method */}
            <div className="space-y-1 mb-4">
              <label className="text-sm font-medium text-muted-foreground">Mode de paiement *</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
              >
                <option value="Espèces">Espèces</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Virement">Virement</option>
              </select>
            </div>

            {/* Parking */}
            <div className="space-y-1 mb-4">
              <label className="text-sm font-medium text-muted-foreground">Parking</label>
              <select
                value={formData.parking_id}
                onChange={(e) => setFormData({ ...formData, parking_id: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
              >
                <option value="">— Aucun —</option>
                {parkings.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-1 mb-6">
              <label className="text-sm font-medium text-muted-foreground">Notes (optionnel)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none h-24"
                placeholder="Détails supplémentaires..."
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('select')}
                className="flex-1 py-4 rounded-xl bg-muted text-foreground font-semibold hover:bg-muted/80 transition-colors">
                Annuler
              </button>
              <button onClick={handleSaveOffline} disabled={submitting}
                className="flex-[2] py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-50">
                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Enregistrer hors ligne'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'confirm' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-2">Paiement enregistré</h2>
            <p className="text-muted-foreground mb-2">
              Il sera synchronisé dès que la connexion revient.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              {formatCurrency(Number(formData.amount))} — {selectedMember?.name}
            </p>
            <button onClick={resetAll}
              className="px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20">
              Nouveau paiement
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default OfflinePaymentPage;
