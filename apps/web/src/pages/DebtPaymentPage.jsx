import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import DebtPaymentForm from '@/components/finance/DebtPaymentForm.jsx';
import { ArrowLeft, DollarSign, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currency.js';

const DebtPaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [debt, setDebt] = useState(null);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const d = await pb.collection('debts').getOne(id, { $autoCancel: false });
        setDebt(d);
        if (d.member_id) {
          pb.collection('members').getOne(d.member_id, { $autoCancel: false })
            .then(m => setMember(m)).catch(() => {});
        }
      } catch (err) {
        console.error(err);
        setError('Impossible de charger la dette.');
      } finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  const handlePayment = async (paymentData) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const clientPaymentId = `debt_${id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const paymentPayload = {
        organization_id: debt.organization_id,
        member_id: debt.member_id || '',
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        payment_date: new Date().toISOString().split('T')[0],
        recorded_by: currentUser?.name || currentUser?.email || 'system',
        collector_id: currentUser?.id || '',
        client_payment_id: clientPaymentId,
        notes: JSON.stringify({ debt_id: id, type: 'debt_payment' }),
      };

      const payment = await pb.collection('payments').create(paymentPayload, { $autoCancel: false });

      const newRemaining = Number(debt.amount_remaining) - paymentData.amount;
      const newStatus = newRemaining <= 0 ? 'paid' : 'partially_paid';
      const updatedDebt = await pb.collection('debts').update(id, {
        amount_remaining: Math.max(0, newRemaining),
        status: newStatus,
      }, { $autoCancel: false });

      try {
        await pb.collection('receipts').create({
          organization_id: debt.organization_id,
          payment_id: payment.id,
          member_id: debt.member_id || '',
          amount: paymentData.amount,
          currency: debt.currency || 'CDF',
          created_by: currentUser?.id || '',
        }, { $autoCancel: false });
      } catch (receiptErr) {
        console.warn('Receipt creation failed (non-blocking):', receiptErr);
      }

      setSuccess({
        message: `Paiement de ${formatCurrency(paymentData.amount)} effectué avec succès !`,
        newStatus,
        newRemaining: Math.max(0, newRemaining),
      });
      setDebt(updatedDebt);
      toast.success('Paiement enregistré !');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Erreur lors du paiement';
      setError(msg);
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

  if (error && !debt) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
        <Header /><div className="flex-1 flex"><AppSidebar /><main className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-bold">{error}</p>
          <button onClick={() => navigate('/debts')} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Retour</button>
        </main></div>
      </div>
    );
  }

  if (!debt) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => navigate(`/debts/${id}`)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Retour à la dette
            </button>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Payer une Dette</h1>
                  <p className="text-sm text-muted-foreground">{member?.name || 'Membre'} — {debt.debt_type}</p>
                </div>
              </div>

              {success ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{success.message}</h3>
                  <p className="text-sm text-muted-foreground">
                    Nouveau statut : {success.newStatus} — Restant : {formatCurrency(success.newRemaining)}
                  </p>
                  <div className="flex gap-3 justify-center pt-4">
                    <button onClick={() => navigate(`/debts/${id}`)}
                      className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">
                      Voir la dette
                    </button>
                    <button onClick={() => navigate('/debts')}
                      className="px-6 py-3 rounded-xl bg-muted text-foreground font-bold hover:bg-muted/80 transition-all">
                      Retour aux dettes
                    </button>
                  </div>
                </div>
              ) : (
                <DebtPaymentForm debt={debt} onSubmit={handlePayment} submitting={submitting} onCancel={() => navigate(`/debts/${id}`)} />
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DebtPaymentPage;
