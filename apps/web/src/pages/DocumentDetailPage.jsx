import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import ExpiryBadge from '@/components/documents/ExpiryBadge.jsx';
import {
  FileText, Loader2, AlertCircle, ArrowLeft, Edit, Calendar, Download, Tag, User
} from 'lucide-react';

const RELATED_LABELS = {
  vehicle: 'Véhicule', driver: 'Chauffeur', member: 'Membre', owner: 'Propriétaire',
};

const DocumentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        setLoading(true);
        const d = await pb.collection('documents').getOne(id, { $autoCancel: false });
        setDoc(d);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les détails du document.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

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

  const fileUrl = doc.file ? pb.files?.getUrl?.(doc, doc.file) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => navigate('/documents')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Retour à la liste
              </button>
              <Link to={`/documents/${doc.id}/edit`}
                className="flex items-center gap-2 bg-primary/10 text-primary font-bold px-4 py-2 rounded-xl hover:bg-primary/20 transition-all text-sm">
                <Edit className="w-4 h-4" /> Modifier
              </Link>
            </div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 shadow-card">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-foreground">{doc.label || doc.document_type || 'Sans libellé'}</h1>
                    <StatusBadge status={doc.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{doc.document_type}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Informations</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1"><Tag className="w-3 h-3" /> Type</span>
                      <span className="text-sm font-semibold text-foreground">{doc.document_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1"><FileText className="w-3 h-3" /> Libellé</span>
                      <span className="text-sm font-semibold text-foreground">{doc.label || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> Entité liée</span>
                      <span className="text-sm font-semibold text-foreground">{RELATED_LABELS[doc.related_type] || doc.related_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">ID Entité</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded text-foreground">{doc.related_id}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Expiration</span>
                      <span className="text-sm font-semibold text-foreground">
                        {doc.expiry_date ? (
                          <span className="flex items-center gap-2">
                            {new Date(doc.expiry_date).toLocaleDateString('fr-FR')}
                            <ExpiryBadge expiryDate={doc.expiry_date} />
                          </span>
                        ) : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Fichier</h3>
                  {fileUrl ? (
                    <div className="space-y-3">
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-primary/10 text-primary font-bold px-4 py-3 rounded-xl hover:bg-primary/20 transition-all text-sm w-fit">
                        <Download className="w-4 h-4" /> Télécharger
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun fichier joint.</p>
                  )}
                </div>
              </div>

              {doc.notes && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</h3>
                  <p className="text-sm text-foreground">{doc.notes}</p>
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocumentDetailPage;
