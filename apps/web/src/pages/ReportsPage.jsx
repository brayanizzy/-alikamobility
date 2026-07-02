import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { generateDailyReport } from '@/utils/DailyReportPDF.jsx';
import {
  BarChart3, Users, CreditCard, MapPin, FileText, Loader2,
  TrendingUp, Calendar, Download, ArrowLeft, UserPlus, AlertCircle,
  PieChart as PieIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { formatCurrency } from '@/utils/currency.js';

const PIE_COLORS = ['#FFB800', '#1A237E', '#00C853', '#EF4444', '#8B5CF6', '#F97316'];
const PERIODS = [
  { key: 'day', label: "Aujourd'hui" },
  { key: 'week', label: '7 jours' },
  { key: 'month', label: '30 jours' },
  { key: 'custom', label: 'Personnalisé' },
];

const ReportsPage = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [parkingFilter, setParkingFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');

  const [stats, setStats] = useState({
    totalRevenue: 0, totalPayments: 0, totalMembers: 0,
    activeMembers: 0, totalArrieres: 0, recoveryRate: 0,
    prevRevenue: 0, prevPayments: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [parkings, setParkings] = useState([]);
  const [agents, setAgents] = useState([]);
  const [revenueByParking, setRevenueByParking] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [topPayers, setTopPayers] = useState([]);

  const orgId = currentUser?.organization_id;

  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    if (selectedPeriod === 'week') start.setDate(now.getDate() - 7);
    else if (selectedPeriod === 'month') start.setMonth(now.getMonth() - 1);
    else if (selectedPeriod === 'day') start.setDate(now.getDate() - 1);
    else if (selectedPeriod === 'custom') {
      return { startStr: customStart, endStr: customEnd };
    }
    return { startStr: start.toISOString().split('T')[0], endStr: now.toISOString().split('T')[0] };
  };

  const getPrevRange = () => {
    const { startStr, endStr } = getDateRange();
    const diff = new Date(endStr).getTime() - new Date(startStr).getTime();
    const prevEnd = new Date(new Date(startStr).getTime() - 1).toISOString().split('T')[0];
    const prevStart = new Date(new Date(startStr).getTime() - diff).toISOString().split('T')[0];
    return { startStr: prevStart, endStr: prevEnd };
  };

  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      pb.collection('parkings').getFullList({ filter: `organization_id = "${orgId}"`, $autoCancel: false }),
      pb.collection('users').getFullList({ filter: `organization_id = "${orgId}" && role = "agent"`, $autoCancel: false }),
    ]).then(([p, a]) => { setParkings(p); setAgents(a); }).catch(() => {});
  }, [orgId]);

  useEffect(() => {
    if (orgId && (selectedPeriod !== 'custom' || (customStart && customEnd))) {
      fetchReportData();
    }
  }, [orgId, selectedPeriod, customStart, customEnd, parkingFilter, agentFilter]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const { startStr, endStr } = getDateRange();
      const prev = getPrevRange();

      const buildFilter = (s, e) => {
        let f = `organization_id = "${orgId}" && payment_date >= "${s}" && payment_date <= "${e}"`;
        if (parkingFilter) f += ` && parking_id = "${parkingFilter}"`;
        if (agentFilter) f += ` && collector_id = "${agentFilter}"`;
        return f;
      };

      const [payments, prevPayments, members] = await Promise.all([
        pb.collection('payments').getFullList({ filter: buildFilter(startStr, endStr), sort: 'payment_date', $autoCancel: false }),
        pb.collection('payments').getFullList({ filter: buildFilter(prev.startStr, prev.endStr), sort: 'payment_date', $autoCancel: false }),
        pb.collection('members').getFullList({ filter: `organization_id = "${orgId}"`, $autoCancel: false }),
      ]);

      const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
      const prevRevenue = prevPayments.reduce((s, p) => s + p.amount, 0);
      const activeMembers = members.filter(m => m.status === 'active').length;
      const totalArrieres = members.reduce((s, m) => s + (Number(m.debt_amount) || Number(m.debt_balance) || 0), 0);
      const uniquePayers = new Set(payments.map(p => p.member_id)).size;
      const recoveryRate = activeMembers > 0 ? ((uniquePayers / activeMembers) * 100) : 0;

      setStats({ totalRevenue, totalPayments: payments.length, totalMembers: members.length, activeMembers, totalArrieres, recoveryRate: parseFloat(recoveryRate.toFixed(1)), prevRevenue, prevPayments: prevPayments.length });

      // Daily chart
      const grouped = {};
      payments.forEach(p => {
        const d = p.payment_date?.split('T')[0] || p.created?.split('T')[0];
        if (!d) return;
        grouped[d] = (grouped[d] || 0) + p.amount;
      });
      setChartData(Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), Revenu: amount,
      })));

      // Revenue by parking
      const parkingMap = {};
      const parkingNames = {};
      parkings.forEach(p => { parkingNames[p.id] = p.name; });
      payments.forEach(p => {
        const pid = p.parking_id || 'unknown';
        parkingMap[pid] = (parkingMap[pid] || 0) + p.amount;
      });
      setRevenueByParking(Object.entries(parkingMap).map(([id, amount]) => ({
        name: parkingNames[id] || (id === 'unknown' ? 'Non attribué' : id.substring(0, 8)),
        Montant: amount,
      })));

      // Payment methods pie
      const methodMap = {};
      payments.forEach(p => {
        const m = p.payment_method || 'cash';
        methodMap[m] = (methodMap[m] || 0) + p.amount;
      });
      const LABELS = { cash: 'Espèces', mobile: 'Mobile Money', card: 'Carte', bank: 'Banque' };
      setPaymentMethods(Object.entries(methodMap).map(([method, amount]) => ({
        name: LABELS[method] || method, value: amount,
      })));

      // Top payers
      const memberTotals = {};
      payments.forEach(p => {
        const mid = p.member_id;
        memberTotals[mid] = (memberTotals[mid] || 0) + p.amount;
      });
      const memberMap = {};
      members.forEach(m => { memberMap[m.id] = m; });
      setTopPayers(Object.entries(memberTotals)
        .sort(([, a], [, b]) => b - a).slice(0, 5)
        .map(([id, amount]) => ({ name: memberMap[id]?.name || 'Inconnu', amount })));
    } catch (err) {
      toast.error('Erreur lors du chargement des rapports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true);
    toast.info('Génération du rapport PDF...');
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const [payments, org] = await Promise.all([
        pb.collection('payments').getFullList({
          filter: `organization_id = "${orgId}" && payment_date >= "${todayStr}" && payment_date < "${tomorrowStr}"`,
          sort: 'created', $autoCancel: false,
        }),
        pb.collection('organizations').getOne(orgId, { $autoCancel: false }).catch(() => ({ name: '' })),
      ]);

      const memberIds = [...new Set(payments.map(p => p.member_id))];
      const membersMap = {};
      if (memberIds.length > 0) {
        const membersFilter = memberIds.map(id => `id="${id}"`).join(' || ');
        const members = await pb.collection('members').getFullList({
          filter: membersFilter, $autoCancel: false,
        });
        members.forEach(m => { membersMap[m.id] = m; });
      }
      const reportData = {
        payments: payments.map(p => ({
          ...p, memberName: membersMap[p.member_id]?.name || 'Inconnu', motoNumber: membersMap[p.member_id]?.moto_number || 'N/A',
        })),
        totalAmount: payments.reduce((s, p) => s + p.amount, 0),
      };
      await generateDailyReport(reportData, org.name);
      toast.success('Rapport PDF téléchargé !');
    } catch (err) {
      toast.error('Erreur lors de la génération PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleExportCSV = () => {
    if (chartData.length === 0) { toast.error('Aucune donnée à exporter'); return; }
    const { startStr, endStr } = getDateRange();
    let csv = 'Date,Revenu (FC)\n';
    chartData.forEach(r => { csv += `${r.date},${r.Revenu}\n`; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `rapport_alika_${startStr}_${endStr}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('CSV téléchargé');
  };

  const periodDiff = useMemo(() => {
    if (stats.prevRevenue === 0) return null;
    return ((stats.totalRevenue - stats.prevRevenue) / stats.prevRevenue * 100).toFixed(1);
  }, [stats]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-border bg-card/80 backdrop-blur z-10 hidden md:flex flex-col">
          <div className="p-6 flex-1">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-4">Panel Association</h2>
            <nav className="space-y-1">
              <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
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
              <Link to="/reports" className="flex items-center gap-3 px-3 py-2.5 bg-primary/20 text-primary rounded-lg font-medium transition-colors">
                <BarChart3 className="w-4 h-4" /> Rapports
              </Link>
            </nav>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2">Rapports & Analyses</h1>
                <p className="text-muted-foreground text-lg">Performances financières de votre association.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleExportCSV}
                  className="bg-card border border-border text-foreground font-bold px-4 py-3 rounded-xl hover:bg-muted active:scale-95 transition-all flex items-center gap-2">
                  <Download className="w-4 h-4" /> CSV
                </button>
                <button onClick={handleExportPDF} disabled={isGeneratingPDF}
                  className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50">
                  {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  PDF du jour
                </button>
              </div>
            </header>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-8 items-end">
              <div className="flex gap-2 bg-card border border-border p-1 rounded-xl">
                {PERIODS.map(p => (
                  <button key={p.key} onClick={() => setSelectedPeriod(p.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${selectedPeriod === p.key ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
              {selectedPeriod === 'custom' && (
                <>
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                    className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  <span className="text-muted-foreground text-sm">à</span>
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                    className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </>
              )}
              <select value={parkingFilter} onChange={e => setParkingFilter(e.target.value)}
                className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Tous les parkings</option>
                {parkings.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)}
                className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Tous les agents</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name || a.email}</option>)}
              </select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="lg:col-span-2 bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 shadow-lg text-primary-foreground">
                    <span className="opacity-90 font-medium flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5" /> Revenu Total</span>
                    <span className="text-4xl md:text-5xl font-extrabold">{formatCurrency(stats.totalRevenue)}</span>
                    {periodDiff !== null && (
                      <span className={`block mt-2 text-sm font-bold ${Number(periodDiff) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {Number(periodDiff) >= 0 ? '+' : ''}{periodDiff}% vs période précédente
                      </span>
                    )}
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-6 flex flex-col">
                    <span className="text-muted-foreground font-medium mb-2 flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Paiements</span>
                    <span className="text-4xl font-extrabold text-foreground mt-auto">{stats.totalPayments}</span>
                    <span className="text-xs text-muted-foreground mt-1">vs {stats.prevPayments} préc.</span>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-6 flex flex-col">
                    <span className="text-muted-foreground font-medium mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-secondary" /> Membres Actifs</span>
                    <span className="text-4xl font-extrabold text-foreground mt-auto">{stats.activeMembers}<span className="text-lg text-muted-foreground font-normal"> / {stats.totalMembers}</span></span>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-6 flex flex-col">
                    <span className="text-muted-foreground font-medium mb-2 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-green-500" /> Taux Recouvrement</span>
                    <span className="text-4xl font-extrabold text-foreground mt-auto">{stats.recoveryRate}%</span>
                  </div>
                  <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 flex flex-col">
                    <span className="text-destructive font-medium mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Arriérés</span>
                    <span className="text-4xl font-extrabold text-destructive mt-auto">{formatCurrency(stats.totalArrieres)}</span>
                  </div>
                </div>

                {/* Charts grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Daily revenue */}
                  {chartData.length > 0 && (
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm lg:col-span-2">
                      <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" /> Évolution des Recettes
                      </h3>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }}
                            formatter={v => [formatCurrency(v), 'Revenu']} />
                          <Bar dataKey="Revenu" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Revenue by parking */}
                  {revenueByParking.length > 0 && (
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                      <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-secondary" /> Revenu par Parking
                      </h3>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={revenueByParking} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                          <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                            formatter={v => [formatCurrency(v), 'Revenu']} />
                          <Bar dataKey="Montant" fill="hsl(var(--secondary))" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Payment method pie */}
                  {paymentMethods.length > 0 && (
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                      <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                        <PieIcon className="w-5 h-5 text-primary" /> Modes de Paiement
                      </h3>
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie data={paymentMethods} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value">
                            {paymentMethods.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                            formatter={v => [formatCurrency(v), 'Montant']} />
                          <Legend formatter={v => <span className="text-foreground text-sm">{v}</span>} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Top payers */}
                {topPayers.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" /> Top 5 Cotisants
                    </h3>
                    <div className="space-y-3">
                      {topPayers.map((m, i) => (
                        <div key={i} className="flex items-center justify-between py-2 px-4 bg-muted/30 rounded-xl">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                            <span className="font-bold text-foreground">{m.name}</span>
                          </div>
                          <span className="font-bold text-foreground">{formatCurrency(m.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default ReportsPage;
