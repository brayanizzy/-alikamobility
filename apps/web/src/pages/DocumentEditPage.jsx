import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import DocumentForm from '@/components/documents/DocumentForm.jsx';
import { ArrowLeft, FileText, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const DocumentEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const d = await pb.collection('documents').getOne(id, { $autoCancel: false });
        setDoc(d);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les données du document.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const payload = { ...formData };
      delete payload.organization_id;
      delete payload.file;
      await pb.collection('documents').update(id, payload, { $autoCancel: false });
      toast.success('Document modifié avec succès !');
      navigate(`/documents/${id}`);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Erreur lors de la modification';
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

  if (error || !doc) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
        <Header /><div className="flex-1 flex"><AppSidebar /><main className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-bold">{error || 'Document introuvable.'}</p>
          <button onClick={() => navigate('/documents')} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Retour</button>
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
            <button onClick={() => navigate(`/documents/${id}`)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Retour au document
            </button>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Modifier le Document</h1>
                  <p className="text-sm text-muted-foreground">{doc.label || doc.document_type}</p>
                </div>
              </div>

              <DocumentForm initialData={doc} onSubmit={handleSubmit} submitLabel="Enregistrer les Modifications" submitting={submitting} />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocumentEditPage;
