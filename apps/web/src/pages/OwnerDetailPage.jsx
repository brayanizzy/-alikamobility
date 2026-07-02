import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import PersonRoleBadge from '@/components/people/PersonRoleBadge.jsx';
import {
  UserCircle, Loader2, AlertCircle, ArrowLeft, Phone, Truck, Calendar
} from 'lucide-react';

const OwnerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [owner, setOwner] = useState(null);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const ownerRes = await pb.collection('owners').getOne(id, { $autoCancel: false });
        setOwner(ownerRes);

        if (ownerRes.member_id) {
          const memberRes = await pb.collection('members').getOne(ownerRes.member_id, { $autoCancel: false });
          setMember(memberRes);
        }
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les détails du propriétaire.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
        <Header /><div className="flex-1 flex"><AppSidebar /><main className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></main></div>
      </div>
    );
  }

  if (error || !owner) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
        <Header /><div className="flex-1 flex"><AppSidebar /><main className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-bold">{error || 'Propriétaire introuvable.'}</p>
          <button onClick={() => navigate('/owners')} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Retour</button>
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
          <div className="max-w-3xl mx-auto">
            <button onClick={() => navigate('/owners')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Retour à la liste
            </button>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <UserCircle className="w-8 h-8 text-purple-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold text-foreground">{member?.name || 'Membre inconnu'}</h1>
                      <PersonRoleBadge role="owner" />
                    </div>
                    {member?.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />{member.phone}
                      </p>
                    )}
                  </div>
                </div>

                {member && (
                  <div className="border-t border-border pt-6 mt-6">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Informations Membre</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Code Membre</p>
                        <code className="text-sm bg-muted px-2 py-1 rounded text-foreground">{member.code_member || '—'}</code>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Membre depuis</p>
                        <p className="text-sm font-semibold text-foreground flex items-center gap-1"><Calendar className="w-3 h-3 text-muted-foreground" />{new Date(member.created).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-border pt-6 mt-6">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Véhicules
                  </h3>
                  <div className="bg-muted/50 border border-border rounded-xl p-6 text-center">
                    <Truck className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-base font-bold text-foreground mb-1">Module Véhicules à venir</p>
                    <p className="text-sm text-muted-foreground">La gestion des véhicules sera disponible dans le Module 4.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OwnerDetailPage;
