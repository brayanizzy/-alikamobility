import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import LineForm from '@/components/transport/LineForm.jsx';
import { ArrowLeft, Route } from 'lucide-react';
import { toast } from 'sonner';

const LineCreatePage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data) => {
    setSubmitting(true);
    try {
      await pb.collection('lines').create(data, { $autoCancel: false });
      toast.success('Ligne créée avec succès !');
      navigate('/lines');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Erreur lors de la création';
      toast.error(msg);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => navigate('/lines')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Retour à la liste
            </button>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <Route className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Ajouter une Ligne</h1>
                  <p className="text-sm text-muted-foreground">Enregistrer une nouvelle ligne de transport.</p>
                </div>
              </div>
              <LineForm onSubmit={handleSubmit} submitLabel="Créer la Ligne" submitting={submitting} />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LineCreatePage;
