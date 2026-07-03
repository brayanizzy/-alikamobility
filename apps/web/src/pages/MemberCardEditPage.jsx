import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import MemberCardForm from '@/components/cards/MemberCardForm.jsx';
import { ArrowLeft, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const MemberCardEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        setLoading(true);
        const c = await pb.collection('member_cards').getOne(id, { $autoCancel: false });
        setCard(c);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger la carte.');
      } finally { setLoading(false); }
    };
    fetchCard();
  }, [id]);

  const handleSubmit = async (data) => {
    setSubmitting(true);
    try {
      await pb.collection('member_cards').update(id, data, { $autoCancel: false });
      toast.success('Carte membre modifiée avec succès !');
      navigate(`/member-cards/${id}`);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Erreur lors de la modification';
      toast.error(msg);
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
        <Header /><div className="flex-1 flex"><AppSidebar /><main className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></main></div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
        <Header /><div className="flex-1 flex"><AppSidebar /><main className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-bold">{error || 'Carte introuvable.'}</p>
          <button onClick={() => navigate('/member-cards')} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Retour</button>
        </main></div>
      </div>
    );
  }

  const initialData = {
    member_id: card.member_id,
    card_number: card.card_number,
    card_type: card.card_type,
    issued_date: card.issued_date,
    expiry_date: card.expiry_date || '',
    pin: card.pin || '',
    notes: card.notes || '',
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => navigate(`/member-cards/${id}`)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Retour au détail
            </button>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Modifier la Carte</h1>
                  <p className="text-sm text-muted-foreground font-mono">{card.card_number}</p>
                </div>
              </div>
              <MemberCardForm onSubmit={handleSubmit} submitLabel="Enregistrer les modifications" submitting={submitting} initial={initialData} />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MemberCardEditPage;
