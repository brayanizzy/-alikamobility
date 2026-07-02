import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import PenaltyForm from '@/components/finance/PenaltyForm.jsx';
import { ArrowLeft, Ban, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const PenaltyEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [penalty, setPenalty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPenalty = async () => {
      try {
        const p = await pb.collection('penalties').getOne(id, { $autoCancel: false });
        setPenalty(p);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les données de la pénalité.');
      } finally { setLoading(false); }
    };
    fetchPenalty();
  }, [id]);

  const handleSubmit = async (data) => {
    setSubmitting(true);
    try {
      await pb.collection('penalties').update(id, data, { $autoCancel: false });
      toast.success('Pénalité modifiée avec succès !');
      navigate(`/penalties/${id}`);
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

  if (error || !penalty) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
        <Header /><div className="flex-1 flex"><AppSidebar /><main className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-bold">{error || 'Pénalité introuvable.'}</p>
          <button onClick={() => navigate('/penalties')} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Retour</button>
        </main></div>
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
            <button onClick={() => navigate(`/penalties/${id}`)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Retour à la pénalité
            </button>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                  <Ban className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Modifier la Pénalité</h1>
                  <p className="text-sm text-muted-foreground">Modifier les informations de la pénalité.</p>
                </div>
              </div>
              <PenaltyForm initialData={penalty} onSubmit={handleSubmit} submitLabel="Enregistrer les Modifications" submitting={submitting} />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PenaltyEditPage;
