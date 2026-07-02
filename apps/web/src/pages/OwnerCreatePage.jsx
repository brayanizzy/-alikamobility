import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import MemberSelector from '@/components/people/MemberSelector.jsx';
import { ArrowLeft, Save, Loader2, AlertCircle, UserCircle } from 'lucide-react';
import { toast } from 'sonner';

const OwnerCreatePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedMember, setSelectedMember] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember) {
      setError('Veuillez sélectionner un membre.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const existing = await pb.collection('owners').getList(1, 1, {
        filter: `member_id = "${selectedMember.id}" && organization_id = "${currentUser?.organization_id}"`,
        $autoCancel: false,
      });
      if (existing.totalItems > 0) {
        throw new Error('Ce membre est déjà enregistré comme propriétaire.');
      }

      const record = await pb.collection('owners').create({
        member_id: selectedMember.id,
        organization_id: currentUser?.organization_id,
      }, { $autoCancel: false });
      toast.success('Propriétaire ajouté avec succès !');
      navigate(`/owners/${record.id}`);
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
            <button onClick={() => navigate('/owners')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Retour à la liste
            </button>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Nouveau Propriétaire</h1>
                  <p className="text-sm text-muted-foreground">Lier un membre existant comme propriétaire.</p>
                </div>
              </div>

              {error && (
                <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-destructive">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Membre</label>
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

                <button type="submit" disabled={submitting || !selectedMember}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl py-3 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {submitting ? 'Enregistrement...' : 'Ajouter le Propriétaire'}
                </button>
              </form>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OwnerCreatePage;
