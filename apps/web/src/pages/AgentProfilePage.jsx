import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { formatCurrency } from '@/utils/currency.js';
import { AGENT_TYPE_LABELS, isOfficeCollector } from '@/utils/roles.js';
import {
  User, MapPin, Phone, Mail, Calendar, CreditCard, ScanLine,
  Loader2, AlertCircle, TrendingUp, ChevronLeft, Shield,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AgentProfilePage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [parkingName, setParkingName] = useState('');
  const [stats, setStats] = useState({ today: 0, todayCount: 0, week: 0, weekCount: 0, total: 0, totalCount: 0 });
  const [recentPayments, setRecentPayments] = useState([]);

  const fetchProfile = async () => {
    try {
      setError(null);
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      const orgId = currentUser.organization_id;
      const agentName = currentUser.name || currentUser.email;

      const [paymentsRes, parking] = await Promise.all([
        pb.collection('payments').getList(1, 500, {
          filter: `organization_id = "${orgId}" && recorded_by = "${agentName}" && payment_date >= "${weekAgo}"`,
          sort: '-created',
          $autoCancel: false,
        }),
        currentUser.parking_id
          ? pb.collection('parkings').getOne(currentUser.parking_id, { $autoCancel: false }).catch(() => null)
          : Promise.resolve(null),
      ]);
      const allPayments = paymentsRes.items || [];

      setParkingName(parking?.name || '');

      const todayPayments = allPayments.filter(p =>
        (p.payment_date || p.created)?.startsWith(today)
      );
      const weekPayments = allPayments.filter(p =>
        (p.payment_date || p.created) >= weekAgo
      );

      setStats({
        today: todayPayments.reduce((s, p) => s + p.amount, 0),
        todayCount: todayPayments.length,
        week: weekPayments.reduce((s, p) => s + p.amount, 0),
        weekCount: weekPayments.length,
        total: allPayments.reduce((s, p) => s + p.amount, 0),
        totalCount: allPayments.length,
      });

      setRecentPayments(allPayments.slice(0, 10));
    } catch (err) {
      setError("Impossible de charger le profil.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-4 px-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="font-bold">{error}</p>
          <button onClick={fetchProfile}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/agent" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ChevronLeft className="w-4 h-4" /> Retour au portail
          </Link>

          {/* Profile header */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground text-3xl font-black shadow-lg shrink-0">
                {(currentUser.name || currentUser.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold text-foreground">{currentUser.name || 'Agent'}</h1>
                <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 mt-1">
                  <Shield className="w-4 h-4 text-secondary" />
                  {AGENT_TYPE_LABELS[currentUser.agent_type] || 'Récupérateur terrain'}
                </p>
                <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="w-4 h-4" /> {currentUser.email}
                  </span>
                  {currentUser.phone && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="w-4 h-4" /> {currentUser.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-4 h-4" /> Membre depuis {new Date(currentUser.created).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                    <MapPin className="w-3.5 h-3.5" /> {parkingName || 'Parking non assigné'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Aujourd'hui</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(stats.today)}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.todayCount} encaissements</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Cette semaine</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.week)}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.weekCount} encaissements</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Total général</p>
              <p className="text-2xl font-bold text-secondary">{formatCurrency(stats.total)}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.totalCount} encaissements</p>
            </div>
          </div>

          {/* Recent payments */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> Derniers encaissements
              </h3>
              <Link to="/payments" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                Voir tout
              </Link>
            </div>
            {recentPayments.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">Aucun encaissement pour le moment.</div>
            ) : (
              <div className="divide-y divide-border">
                {recentPayments.map(p => (
                  <div key={p.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">{formatCurrency(p.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.payment_id || p.id?.substring(0, 8)} · {new Date(p.payment_date || p.created).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full capitalize">
                      {p.payment_method || 'cash'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AgentProfilePage;
