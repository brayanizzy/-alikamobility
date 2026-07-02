import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import MemberCardPreview from '@/components/cards/MemberCardPreview.jsx';
import QRCodeDisplay from '@/components/cards/QRCodeDisplay.jsx';
import { Eye, Printer, Loader2, AlertCircle, ArrowLeft, Edit, User, Calendar, Shield, Lock, FileText } from 'lucide-react';

const MemberCardDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const c = await pb.collection('member_cards').getOne(id, { $autoCancel: false });
        setCard(c);

        if (c.member_id) {
          pb.collection('members').getOne(c.member_id, { $autoCancel: false })
            .then(m => setMember(m)).catch(() => {});
        }
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les détails de la carte.');
      } finally { setLoading(false); }
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

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <button onClick={() => navigate('/member-cards')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Retour aux cartes
            </button>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <MemberCardPreview card={card} memberName={member?.name} />

                <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" /> Code QR
                  </h3>
                  <QRCodeDisplay cardNumber={card.card_number} size={200} />
                </div>
              </div>

              <div className="lg:col-span-3 space-y-6">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground">Informations</h2>
                    <div className="flex gap-2">
                      <Link to={`/member-cards/${card.id}/print`}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-foreground font-semibold hover:bg-muted/80 transition-all text-sm">
                        <Printer className="w-4 h-4" /> Imprimer
                      </Link>
                      <Link to={`/member-cards/${card.id}/edit`}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all text-sm">
                        <Edit className="w-4 h-4" /> Modifier
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Numéro de carte</p>
                      <p className="font-bold text-foreground font-mono">{card.card_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Statut</p>
                      <StatusBadge status={card.status} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Type</p>
                      <p className="font-bold text-foreground capitalize">{card.card_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Membre lié</p>
                      {member ? (
                        <Link to={`/members/${member.id}`} className="font-bold text-primary hover:underline">
                          {member.name}
                        </Link>
                      ) : (
                        <p className="font-bold text-foreground">{card.member_id}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Date d'émission</p>
                      <p className="font-semibold text-foreground">{card.issued_date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Date d'expiration</p>
                      <p className="font-semibold text-foreground">{card.expiry_date || 'Aucune expiration'}</p>
                    </div>
                  </div>

                  {card.notes && (
                    <div className="mt-5 pt-5 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><FileText className="w-3 h-3" /> Notes</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{card.notes}</p>
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" /> Sécurité
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Code PIN</p>
                      <p className="font-bold text-foreground">{card.pin ? '•'.repeat(card.pin.length) : 'Non défini'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">QR Secret</p>
                      <p className="font-bold text-foreground">{card.qr_secret ? 'Défini' : 'Non défini'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                  <h3 className="font-bold text-foreground mb-4">Métadonnées</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Créé le</p>
                      <p className="font-semibold text-foreground">{new Date(card.created).toLocaleString('fr-FR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Mis à jour le</p>
                      <p className="font-semibold text-foreground">{new Date(card.updated).toLocaleString('fr-FR')}</p>
                    </div>
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

export default MemberCardDetailPage;
