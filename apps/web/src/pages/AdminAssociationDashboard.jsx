import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { generateDailyReport } from '@/utils/DailyReportPDF.jsx';
import {
  Users, CreditCard, MapPin, BarChart3, Loader2, ArrowUpRight, AlertCircle,
  Percent, FileText, UserPlus, TrendingUp, DollarSign, Clock, Activity,
  ChevronRight, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currency.js';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-2xl bg-card border border-border overflow-hidden ${className}`}>
      <div className="animate-shimmer h-full w-full min-h-[120px]" />
    </div>
  );
}

const AdminAssociationDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({ members: 0, todayPayments: 0, todayRevenue: 0, arrieres: 0, recoveryRate: 0, activeMembers: 0 });
  const [recentPayments, setRecentPayments] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const orgId = currentUser.organization_id;

      const membersRes = await pb.collection('members').getList(1, 1, {
        filter: `organization_id = "${orgId}"`,
        $autoCancel: false
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

      const paymentsRes = await pb.collection('payments').getList(1, 500, {
        filter: `organization_id = "${orgId}" && payment_date >= "${sevenDaysAgoStr}"`,
        sort: '-created',
        $autoCancel: false
      });

      const allPayments = paymentsRes.items || [];
      const todayPayments = allPayments.filter(p => p.payment_date === todayStr);
      const todayRevenue = todayPayments.reduce((sum, p) => sum + p.amount, 0);

      const members = await pb.collection('members').getList(1, 500, {
        filter: `organization_id = "${orgId}"`,
        sort: '-created',
        $autoCancel: false
      });

      const allMembers = members.items || [];
      const membersMap = {};
      allMembers.forEach(m => membersMap[m.id] = m);
      const activeMembersCount = allMembers.filter(m => m.status === 'active').length;
      const realArrieres = allMembers.reduce((sum, m) => sum + (Number(m.debt_amount) || Number(m.debt_balance) || 0), 0);
      const uniqueMembersPaidToday = new Set(todayPayments.map(p => p.member_id)).size;
      const realRecoveryRate = activeMembersCount > 0 ? ((uniqueMembersPaidToday / activeMembersCount) * 100).toFixed(1) : 0;

      setStats({
        members: membersRes.totalItems,
        todayPayments: todayPayments.length,
        todayRevenue,
        arrieres: realArrieres,
        recoveryRate: parseFloat(realRecoveryRate),
        activeMembers: activeMembersCount
      });

      const enrichedPayments = todayPayments.slice(0, 8).map(p => ({
        ...p,
        memberName: membersMap[p.member_id]?.name || 'Inconnu',
        memberPhoto: membersMap[p.member_id]?.photo || null
      }));
      setRecentPayments(enrichedPayments);

      // 7-day trend
      const trend = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayPayments = allPayments.filter(p => p.payment_date === dateStr);
        const total = dayPayments.reduce((s, p) => s + p.amount, 0);
        const count = dayPayments.length;
        const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' });
        trend.push({ date: dateStr, day: dayName, revenue: total, count });
      }
      setRevenueTrend(trend);

    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError("Impossible de charger les données. Vérifiez votre connexion.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser?.organization_id) {
      fetchData();
      const interval = setInterval(() => fetchData(true), 15000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleExportReport = async () => {
    setIsGeneratingPDF(true);
    toast.info("Génération du rapport en cours...");
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const paymentsRes = await pb.collection('payments').getList(1, 500, {
        filter: `organization_id = "${currentUser.organization_id}" && payment_date = "${todayStr}"`,
        sort: 'created',
        $autoCancel: false
      });
      const paymentItems = paymentsRes.items || [];
      const memberIds = [...new Set(paymentItems.map(p => p.member_id))];
      const membersMap = {};
      if (memberIds.length > 0) {
        const membersFilter = memberIds.map(id => `id="${id}"`).join(' || ');
        const members = await pb.collection('members').getFullList({
          filter: membersFilter,
          $autoCancel: false
        });
        members.forEach(m => { membersMap[m.id] = m; });
      }
      const reportData = {
        payments: paymentItems.map(p => ({
          ...p,
          memberName: membersMap[p.member_id]?.name || 'Inconnu',
          motoNumber: membersMap[p.member_id]?.moto_number || 'N/A'
        })),
        totalAmount: paymentItems.reduce((sum, p) => sum + p.amount, 0)
      };
      const org = await pb.collection('organizations').getOne(currentUser.organization_id, { $autoCancel: false });
      await generateDailyReport(reportData, org.name);
      toast.success("Rapport téléchargé !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la génération du rapport");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const trendDirection = useMemo(() => {
    if (revenueTrend.length < 2) return 'up';
    const last = revenueTrend[revenueTrend.length - 1].revenue;
    const prev = revenueTrend[revenueTrend.length - 2].revenue;
    if (last > prev) return 'up';
    if (last < prev) return 'down';
    return 'flat';
  }, [revenueTrend]);

  if (isLoading && stats.members === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-4">
          <SkeletonCard className="h-20" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard className="h-40" />
            <SkeletonCard className="h-40" />
            <SkeletonCard className="h-40" />
            <SkeletonCard className="h-40" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SkeletonCard className="lg:col-span-2 h-80" />
            <SkeletonCard className="h-80" />
          </div>
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
          <p className="text-lg font-bold text-center">{error}</p>
          <button onClick={() => { setError(null); fetchData(); }}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 flex overflow-hidden relative">
        <aside className="w-64 border-r border-border bg-card/50 backdrop-blur z-10 hidden md:flex flex-col">
          <div className="p-6 flex-1">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-4">Panel Association</h2>
            <nav className="space-y-1">
              <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 bg-primary/20 text-primary rounded-lg font-medium transition-colors">
                <BarChart3 className="w-4 h-4" /> Vue d'ensemble
              </Link>
              <Link to="/members" className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                <Users className="w-4 h-4" /> Gestion Membres
              </Link>
              <Link to="/parkings" className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                <MapPin className="w-4 h-4" /> Parkings
              </Link>
              <Link to="/agents" className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                <UserPlus className="w-4 h-4" /> Agents
              </Link>
              <Link to="/reports" className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                <BarChart3 className="w-4 h-4" /> Rapports
              </Link>
            </nav>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 z-10">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-6xl mx-auto"
          >
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2">Tableau de Bord</h1>
                <p className="text-muted-foreground text-lg">Performances et métriques de la journée.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => fetchData(true)}
                  className="bg-card border border-border text-foreground font-bold px-4 py-3 rounded-xl hover:bg-muted active:scale-95 transition-all flex items-center justify-center gap-2">
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleExportReport}
                  disabled={isGeneratingPDF}
                  className="bg-secondary text-secondary-foreground font-bold px-5 py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-secondary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Exporter Rapport
                </button>
              </div>
            </motion.div>

            {/* Bento Grid Stats */}
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
              {/* Revenue Hero */}
              <motion.div variants={item}
                className="md:col-span-5 bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full translate-y-1/3 -translate-x-1/4" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-primary-foreground/80 font-medium flex items-center gap-2">
                      <DollarSign className="w-4 h-4" /> Revenu du Jour
                    </span>
                    {trendDirection === 'up' && <TrendingUp className="w-5 h-5 text-green-300" />}
                    {trendDirection === 'down' && <TrendingUp className="w-5 h-5 text-red-300 rotate-180" />}
                  </div>
                  <span className="text-4xl md:text-5xl font-extrabold text-primary-foreground tracking-tight mt-auto">
                    {formatCurrency(stats.todayRevenue)}
                  </span>
                  <span className="text-primary-foreground/60 text-sm mt-1">
                    {stats.todayPayments} encaissement{stats.todayPayments > 1 ? 's' : ''} aujourd'hui
                  </span>
                </div>
              </motion.div>

              {/* Recovery Rate */}
              <motion.div variants={item}
                className="md:col-span-3 bg-card border border-border rounded-2xl p-6 shadow-card flex flex-col"
              >
                <span className="text-muted-foreground font-medium mb-1 flex items-center gap-2 text-sm">
                  <Activity className="w-4 h-4 text-primary" /> Recouvrement
                </span>
                <span className="text-4xl font-extrabold text-foreground mt-auto">{stats.recoveryRate}%</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {stats.activeMembers} membres actifs
                </span>
                {/* Mini bar */}
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(stats.recoveryRate, 100)}%` }}
                  />
                </div>
              </motion.div>

              {/* Today Payments */}
              <motion.div variants={item}
                className="md:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-card flex flex-col"
              >
                <span className="text-muted-foreground font-medium mb-1 flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4 text-secondary" /> Paiements
                </span>
                <span className="text-4xl font-extrabold text-foreground mt-auto">{stats.todayPayments}</span>
                <span className="text-xs text-muted-foreground mt-1">aujourd'hui</span>
              </motion.div>

              {/* Total Members */}
              <motion.div variants={item}
                className="md:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-card flex flex-col"
              >
                <span className="text-muted-foreground font-medium mb-1 flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-primary" /> Membres
                </span>
                <span className="text-4xl font-extrabold text-foreground mt-auto">{stats.members}</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {stats.activeMembers} actifs
                </span>
              </motion.div>
            </motion.div>

            {/* Second Row: Arrears + Quick Actions */}
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
              {/* Arrears */}
              <div className="md:col-span-7 bg-gradient-to-br from-destructive/5 to-destructive/10 border border-destructive/20 rounded-2xl p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-destructive font-medium mb-1 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" /> Arriérés Totaux
                  </span>
                  <p className="text-muted-foreground text-sm">Somme des cotisations impayées</p>
                </div>
                <span className="text-3xl md:text-4xl font-extrabold text-destructive">
                  {formatCurrency(stats.arrieres)}
                </span>
              </div>

              {/* Quick Actions Bento */}
              <div className="md:col-span-5 grid grid-cols-2 gap-4">
                <Link to="/members"
                  className="bg-card border border-border rounded-2xl p-5 hover:bg-muted/50 transition-all shadow-card flex flex-col items-center justify-center gap-3 text-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <span className="font-bold text-foreground text-sm">Membres</span>
                </Link>
                <Link to="/parkings"
                  className="bg-card border border-border rounded-2xl p-5 hover:bg-muted/50 transition-all shadow-card flex flex-col items-center justify-center gap-3 text-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors group-hover:scale-110 transition-transform">
                    <MapPin className="w-6 h-6 text-secondary" />
                  </div>
                  <span className="font-bold text-foreground text-sm">Parkings</span>
                </Link>
                <Link to="/agents"
                  className="bg-card border border-border rounded-2xl p-5 hover:bg-muted/50 transition-all shadow-card flex flex-col items-center justify-center gap-3 text-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors group-hover:scale-110 transition-transform">
                    <UserPlus className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="font-bold text-foreground text-sm">Agents</span>
                </Link>
                <button onClick={handleExportReport} disabled={isGeneratingPDF}
                  className="bg-card border border-border rounded-2xl p-5 hover:bg-muted/50 transition-all shadow-card flex flex-col items-center justify-center gap-3 text-center group disabled:opacity-60"
                >
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors group-hover:scale-110 transition-transform">
                    {isGeneratingPDF ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : <FileText className="w-6 h-6 text-muted-foreground" />}
                  </div>
                  <span className="font-bold text-foreground text-sm">Rapport</span>
                </button>
              </div>
            </motion.div>

            {/* Charts Row */}
            <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Revenue Trend Chart */}
              <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">Tendance des Revenus (7 jours)</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded-full bg-primary/80" />
                    <span>Revenus</span>
                  </div>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          fontSize: '13px'
                        }}
                        formatter={(value) => [formatCurrency(value), 'Revenus']}
                        labelFormatter={(label, payload) => {
                          if (payload?.[0]) return new Date(payload[0].payload.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
                          return label;
                        }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revenueGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Today's Payment Methods */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">Aujourd'hui</h3>
                  <span className="text-xs text-muted-foreground">
                    {recentPayments.length} transactions
                  </span>
                </div>
                <div className="space-y-1">
                  {recentPayments.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <CreditCard className="w-10 h-10 text-muted-foreground/30 mb-3" />
                      <p className="text-foreground font-medium">Aucun paiement</p>
                    </div>
                  ) : (
                    recentPayments.map((p, i) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {p.memberName?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{p.memberName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(p.created).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-green-500">+{formatCurrency(p.amount)}</span>
                      </motion.div>
                    ))
                  )}
                </div>
                {recentPayments.length > 0 && (
                  <Link to="/reports"
                    className="mt-3 flex items-center justify-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors pt-3 border-t border-border"
                  >
                    Voir tous les rapports <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </motion.div>

          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminAssociationDashboard;