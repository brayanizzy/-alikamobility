import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import { formatCurrency } from '@/utils/currency.js';
import {
  FileText, Loader2, AlertCircle, ArrowLeft,
  User, DollarSign, Calendar, UserCircle
} from 'lucide-react';

const ReceiptDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [member, setMember] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const r = await pb.collection('receipts').getOne(id, { $autoCancel: false });
        setReceipt(r);

        const tasks = [];
        if (r.member_id) {
          tasks.push(
            pb.collection('members').getOne(r.member_id, { $autoCancel: false })
              .then(m => setMember(m)).catch(() => {})
          );
        }
        if (r.payment_id) {
          tasks.push(
            pb.collection('payments').getOne(r.payment_id, { $autoCancel: false })
              .then(p => setPayment(p)).catch(() => {})
          );
        }
        await Promise.all(tasks);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger le reçu.');
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

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
        <Header /><div className="flex-1 flex"><AppSidebar /><main className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-bold">{error || 'Reçu introuvable.'}</p>
          <button onClick={() => navigate('/receipts')} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Retour</button>
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
            <button onClick={() => navigate('/receipts')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Retour aux reçus
            </button>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 shadow-card">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Reçu #{receipt.id?.slice(-8)}</h1>
                  <p className="text-sm text-muted-foreground">Émis le {receipt.created ? new Date(receipt.created).toLocaleDateString('fr-FR') : '—'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <User className="w-4 h-4" /> Membre
                    </span>
                    <span className="text-sm font-bold text-foreground">{member?.name || '—'}</span>
                  </div>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <DollarSign className="w-4 h-4" /> Montant
                    </span>
                    <span className="text-lg font-extrabold text-foreground">{formatCurrency(receipt.amount || 0)}</span>
                  </div>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Date
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {receipt.created ? new Date(receipt.created).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                    </span>
                  </div>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Paiement lié
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {payment ? `#${payment.id?.slice(-8)} (${formatCurrency(payment.amount)})` : '—'}
                    </span>
                  </div>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <UserCircle className="w-4 h-4" /> Créé par
                    </span>
                    <span className="text-sm font-bold text-foreground">{receipt.created_by || '—'}</span>
                  </div>
                </div>
              </div>

              <button onClick={() => window.print()}
                className="w-full mt-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 active:scale-95 transition-all">
                Imprimer
              </button>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReceiptDetailPage;
