import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import PaymentMethodBadge from '@/components/finance/PaymentMethodBadge.jsx';
import { formatCurrency } from '@/utils/currency.js';
import {
  Receipt, Loader2, AlertCircle, ArrowLeft, Edit, DollarSign,
  User, Truck, Calendar, CreditCard, Ban
} from 'lucide-react';

const DebtDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [debt, setDebt] = useState(null);
  const [member, setMember] = useState(null);
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [payments, setPayments] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const d = await pb.collection('debts').getOne(id, { $autoCancel: false });
        setDebt(d);

        const fetchTasks = [];
        if (d.member_id) {
          fetchTasks.push(
            pb.collection('members').getOne(d.member_id, { $autoCancel: false })
              .then(m => setMember(m)).catch(() => {})
          );
        }
        if (d.vehicle_id) {
          fetchTasks.push(
            pb.collection('vehicles').getOne(d.vehicle_id, { $autoCancel: false })
              .then(v => setVehiclePlate(v.plate || v.moto_number || 'N/A')).catch(() => {})
          );
        }

        // Fetch payments linked via notes
        const pRes = await pb.collection('payments').getList(1, 50, {
          filter: `organization_id = "${d.organization_id}"`,
          sort: '-created', $autoCancel: false,
        }).catch(() => ({ items: [] }));

        const debtPayments = (pRes.items || []).filter(p => {
          try {
            const notes = p.notes ? JSON.parse(p.notes) : {};
            return notes.debt_id === id;
          } catch { return false; }
        });
        setPayments(debtPayments);

        // Fetch penalties linked to this debt
        const penRes = await pb.collection('penalties').getList(1, 50, {
          filter: `debt_id = "${id}"`, sort: '-created', $autoCancel: false,
        }).catch(() => ({ items: [] }));
        setPenalties(penRes.items || []);

        await Promise.all(fetchTasks);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les détails de la dette.');
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

  if (error || !debt) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
        <Header /><div className="flex-1 flex"><AppSidebar /><main className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-bold">{error || 'Dette introuvable.'}</p>
          <button onClick={() => navigate('/debts')} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Retour</button>
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
              <button onClick={() => navigate('/debts')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Retour aux dettes
              </button>
              <div className="flex gap-2">
                {debt.status !== 'paid' && debt.status !== 'written_off' && (
                  <Link to={`/debts/${debt.id}/pay`}
                    className="flex items-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 font-bold px-4 py-2 rounded-xl hover:bg-green-500/20 transition-all text-sm">
                    <DollarSign className="w-4 h-4" /> Payer
                  </Link>
                )}
                <Link to={`/debts/${debt.id}/edit`}
                  className="flex items-center gap-2 bg-primary/10 text-primary font-bold px-4 py-2 rounded-xl hover:bg-primary/20 transition-all text-sm">
                  <Edit className="w-4 h-4" /> Modifier
                </Link>
              </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Debt Info */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                    <Receipt className="w-8 h-8 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold text-foreground">{member?.name || 'Membre inconnu'}</h1>
                      <StatusBadge status={debt.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{debt.debt_type} — {debt.currency}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-muted/30 rounded-xl p-4 text-center">
                    <Receipt className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Montant Initial</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(debt.amount_original)}</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 text-center">
                    <CreditCard className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Montant Restant</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(debt.amount_remaining)}</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 text-center">
                    <User className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Membre</p>
                    <p className="text-sm font-bold text-foreground">{member?.name || '—'}</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 text-center">
                    <Calendar className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Échéance</p>
                    <p className="text-sm font-bold text-foreground">{debt.due_date ? new Date(debt.due_date).toLocaleDateString('fr-FR') : '—'}</p>
                  </div>
                </div>

                {debt.notes && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</h3>
                    <p className="text-sm text-foreground">{debt.notes}</p>
                  </div>
                )}
              </div>

              {/* Payment History */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5" /> Historique des Paiements
                </h3>
                {payments.length === 0 ? (
                  <div className="py-8 text-center">
                    <DollarSign className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm text-foreground font-medium">Aucun paiement lié à cette dette.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {payments.map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(p.amount)}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <PaymentMethodBadge method={p.payment_method} />
                            <span>{new Date(p.created).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Penalties */}
              {penalties.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                    <Ban className="w-5 h-5" /> Pénalités Liées
                  </h3>
                  <div className="space-y-2">
                    {penalties.map(p => (
                      <Link key={p.id} to={`/penalties/${p.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                          <Ban className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(p.amount)} — {p.reason}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <StatusBadge status={p.status} />
                            <span>{new Date(p.created).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DebtDetailPage;
