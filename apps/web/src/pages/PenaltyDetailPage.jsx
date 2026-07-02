import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import { formatCurrency } from '@/utils/currency.js';
import {
  Ban, Loader2, AlertCircle, ArrowLeft, Edit,
  User, Receipt, Calendar, DollarSign
} from 'lucide-react';

const PenaltyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [penalty, setPenalty] = useState(null);
  const [member, setMember] = useState(null);
  const [debtInfo, setDebtInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const p = await pb.collection('penalties').getOne(id, { $autoCancel: false });
        setPenalty(p);

        const tasks = [];
        if (p.member_id) {
          tasks.push(
            pb.collection('members').getOne(p.member_id, { $autoCancel: false })
              .then(m => setMember(m)).catch(() => {})
          );
        }
        if (p.debt_id) {
          tasks.push(
            pb.collection('debts').getOne(p.debt_id, { $autoCancel: false })
              .then(d => setDebtInfo(d)).catch(() => {})
          );
        }
        await Promise.all(tasks);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger la pénalité.');
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
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => navigate('/penalties')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Retour aux pénalités
              </button>
              <Link to={`/penalties/${penalty.id}/edit`}
                className="flex items-center gap-2 bg-primary/10 text-primary font-bold px-4 py-2 rounded-xl hover:bg-primary/20 transition-all text-sm">
                <Edit className="w-4 h-4" /> Modifier
              </Link>
            </div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 shadow-card">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                  <Ban className="w-8 h-8 text-amber-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-foreground">{member?.name || 'Membre inconnu'}</h1>
                    <StatusBadge status={penalty.status} />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">{penalty.penalty_type}</span>
                    <span className="text-sm text-muted-foreground">·</span>
                    <span className="text-sm text-muted-foreground">{penalty.reason}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-muted/30 rounded-xl p-4 text-center">
                  <DollarSign className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Montant</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(penalty.amount)}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-4 text-center">
                  <User className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Membre</p>
                  <p className="text-sm font-bold text-foreground">{member?.name || '—'}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-4 text-center">
                  <Receipt className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Dette liée</p>
                  <p className="text-sm font-bold text-foreground">{debtInfo ? `${Number(debtInfo.amount_remaining).toLocaleString()} ${debtInfo.currency}` : '—'}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-4 text-center">
                  <Calendar className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Créée le</p>
                  <p className="text-sm font-bold text-foreground">{new Date(penalty.created).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              {penalty.notes && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</h3>
                  <p className="text-sm text-foreground">{penalty.notes}</p>
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PenaltyDetailPage;
