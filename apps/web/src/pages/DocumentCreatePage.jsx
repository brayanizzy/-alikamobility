import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import DocumentForm from '@/components/documents/DocumentForm.jsx';
import { ArrowLeft, FileText } from 'lucide-react';
import { toast } from 'sonner';

const DocumentCreatePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectType = searchParams.get('related_type') || '';
  const preselectId = searchParams.get('related_id') || '';
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (payload.file && payload.file instanceof File) {
        const form = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (key === 'file') {
            form.append(key, value);
          } else {
            form.append(key, value);
          }
        });
        await pb.collection('documents').create(form, { $autoCancel: false });
      } else {
        delete payload.file;
        await pb.collection('documents').create(payload, { $autoCancel: false });
      }
      toast.success('Document créé avec succès !');
      navigate('/documents');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Erreur lors de la création';
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
            <button onClick={() => navigate('/documents')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Retour à la liste
            </button>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Ajouter un Document</h1>
                  <p className="text-sm text-muted-foreground">Enregistrer un document lié à un véhicule, chauffeur ou membre.</p>
                </div>
              </div>

              <DocumentForm
                onSubmit={handleSubmit}
                submitLabel="Créer le Document"
                submitting={submitting}
                preselectType={preselectType}
                preselectId={preselectId}
              />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocumentCreatePage;
