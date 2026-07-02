import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import StatCard from '@/components/dashboard/StatCard.jsx';
import ReportFilters from '@/components/reports/ReportFilters.jsx';
import ReportDataTable from '@/components/reports/ReportDataTable.jsx';
import ExportButtons from '@/components/reports/ExportButtons.jsx';
import { downloadCsv, formatCsvDate, formatCsvFileName } from '@/utils/exportCsv.js';
import { formatPeriod, formatPercent, formatNumber, formatCompactCurrency } from '@/utils/reportFormatters.js';
import { formatCurrency } from '@/utils/currency.js';
import {
  BarChart3, Users, CreditCard, MapPin, FileText, Loader2,
  TrendingUp, Download, AlertCircle, PieChart as PieIcon,
  Truck, UserCircle, Car, Route, BookOpen, Ban, Smartphone,
  DollarSign, LayoutGrid, Wallet, Calendar, ClipboardCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const PIE_COLORS = ['#FFB800', '#1A237E', '#00C853', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4'];
const TABS = [
  { key: 'overview', label: 'Vue globale', icon: LayoutGrid },
  { key: 'finances', label: 'Finances', icon: DollarSign },
  { key: 'terrain', label: 'Terrain', icon: Truck },
  { key: 'members', label: 'Membres', icon: Users },
  { key: 'agents', label: 'Agents', icon: UserCircle },
  { key: 'exports', label: 'Exports', icon: Download },
];

const ReportsPage = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [parkingFilter, setParkingFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [overview, setOverview] = useState(null);
  const [paymentsData, setPaymentsData] = useState(null);
  const [debtsData, setDebtsData] = useState(null);
  const [transportData, setTransportData] = useState(null);
  const [membersData, setMembersData] = useState(null);
  const [agentsData, setAgentsData] = useState(null);
  const [parkings, setParkings] = useState([]);
  const [agents, setAgents] = useState([]);

  const orgId = currentUser?.organization_id;
  const role = currentUser?.role;
  const isSuperAdmin = role === 'super-admin';

  const getDateRange = useCallback(() => {
    const now = new Date();
    const start = new Date();
    if (selectedPeriod === 'week') start.setDate(now.getDate() - 7);
    else if (selectedPeriod === 'month') start.setMonth(now.getMonth() - 1);
    else if (selectedPeriod === 'day') start.setDate(now.getDate() - 1);
    else if (selectedPeriod === 'custom') return { startStr: customStart, endStr: customEnd };
    return {
      startStr: start.toISOString().split('T')[0],
      endStr: now.toISOString().split('T')[0],
    };
  }, [selectedPeriod, customStart, customEnd]);

  useEffect(() => {
    if (!orgId) return;
    const load = async () => {
      try {
        const [p, a] = await Promise.all([
          pb.collection('parkings').getFullList({ filter: `organization_id = "${orgId}"`, $autoCancel: false }).catch(() => []),
          pb.collection('users').getFullList({ filter: `organization_id = "${orgId}" && role = "agent"`, $autoCancel: false }).catch(() => []),
        ]);
        setParkings(p);
        setAgents(a);
      } catch {}
    };
    load();
  }, [orgId]);

  const fetchOverview = useCallback(async () => {
    if (!orgId && !isSuperAdmin) return;
    const { startStr, endStr } = getDateRange();
    try {
      const data = await pb.request('/reports/overview', {
        params: {
          from: startStr,
          to: endStr,
          ...(isSuperAdmin && orgId ? { organization_id: orgId } : {}),
        },
      });
      setOverview(data);
    } catch (err) {
      toast.error('Erreur chargement rapport global');
    }
  }, [orgId, isSuperAdmin, getDateRange]);

  const fetchPayments = useCallback(async () => {
    if (!orgId && !isSuperAdmin) return;
    const { startStr, endStr } = getDateRange();
    try {
      const data = await pb.request('/reports/payments', {
        params: {
          from: startStr, to: endStr,
          parking_id: parkingFilter || undefined,
          agent_id: agentFilter || undefined,
          method: methodFilter || undefined,
          ...(isSuperAdmin && orgId ? { organization_id: orgId } : {}),
        },
      });
      setPaymentsData(data);
    } catch (err) {
      toast.error('Erreur chargement rapport paiements');
    }
  }, [orgId, isSuperAdmin, getDateRange, parkingFilter, agentFilter, methodFilter]);

  const fetchDebts = useCallback(async () => {
    if (!orgId && !isSuperAdmin) return;
    const { startStr, endStr } = getDateRange();
    try {
      const data = await pb.request('/reports/debts', {
        params: {
          from: startStr, to: endStr,
          status: statusFilter || undefined,
          ...(isSuperAdmin && orgId ? { organization_id: orgId } : {}),
        },
      });
      setDebtsData(data);
    } catch {}
  }, [orgId, isSuperAdmin, getDateRange, statusFilter]);

  const fetchTransport = useCallback(async () => {
    if (!orgId && !isSuperAdmin) return;
    try {
      const data = await pb.request('/reports/transport', {
        params: isSuperAdmin && orgId ? { organization_id: orgId } : {},
      });
      setTransportData(data);
    } catch {}
  }, [orgId, isSuperAdmin]);

  const fetchMembers = useCallback(async () => {
    if (!orgId && !isSuperAdmin) return;
    const { startStr, endStr } = getDateRange();
    try {
      const data = await pb.request('/reports/members', {
        params: {
          from: startStr, to: endStr,
          ...(isSuperAdmin && orgId ? { organization_id: orgId } : {}),
        },
      });
      setMembersData(data);
    } catch {}
  }, [orgId, isSuperAdmin, getDateRange]);

  const fetchAgents = useCallback(async () => {
    if (!orgId && !isSuperAdmin) return;
    const { startStr, endStr } = getDateRange();
    try {
      const data = await pb.request('/reports/agent-performance', {
        params: {
          from: startStr, to: endStr,
          ...(isSuperAdmin && orgId ? { organization_id: orgId } : {}),
        },
      });
      setAgentsData(data);
    } catch {}
  }, [orgId, isSuperAdmin, getDateRange]);

  useEffect(() => {
    if (!orgId && !isSuperAdmin) return;
    if (selectedPeriod === 'custom' && (!customStart || !customEnd)) return;

    setIsLoading(true);
    Promise.all([
      fetchOverview(),
      fetchPayments(),
      fetchDebts(),
      fetchTransport(),
      fetchMembers(),
      fetchAgents(),
    ]).finally(() => setIsLoading(false));
  }, [orgId, isSuperAdmin, selectedPeriod, customStart, customEnd, parkingFilter, agentFilter, methodFilter, statusFilter,
      fetchOverview, fetchPayments, fetchDebts, fetchTransport, fetchMembers, fetchAgents]);

  const { startStr, endStr } = getDateRange();

  // CSV Exports
  const exportPaymentsCsv = () => {
    if (!paymentsData?.rows?.length) { toast.error('Aucune donnée à exporter'); return; }
    setIsExporting(true);
    try {
      downloadCsv(
        formatCsvFileName('rapport-encaissements', startStr, endStr),
        paymentsData.rows,
        [
          { key: 'member_name', label: 'Membre' },
          { key: 'amount', label: 'Montant' },
          { key: 'payment_method', label: 'Méthode' },
          { key: 'payment_date', label: 'Date', render: r => formatCsvDate(r.payment_date) },
          { key: 'parking_id', label: 'Parking' },
          { key: 'collector_id', label: 'Agent' },
        ]
      );
      toast.success('CSV encaissements téléchargé');
    } finally { setIsExporting(false); }
  };

  const exportDebtsCsv = () => {
    if (!debtsData?.top_debtors?.length) { toast.error('Aucune donnée à exporter'); return; }
    setIsExporting(true);
    try {
      downloadCsv(
        formatCsvFileName('rapport-dettes', startStr, endStr),
        debtsData.top_debtors,
        [
          { key: 'member_name', label: 'Membre' },
          { key: 'amount_original', label: 'Montant initial' },
          { key: 'amount_remaining', label: 'Restant dû' },
          { key: 'status', label: 'Statut' },
          { key: 'currency', label: 'Devise' },
        ]
      );
      toast.success('CSV dettes téléchargé');
    } finally { setIsExporting(false); }
  };

  const exportAgentsCsv = () => {
    if (!agentsData?.agents?.length) { toast.error('Aucune donnée à exporter'); return; }
    setIsExporting(true);
    try {
      downloadCsv(
        formatCsvFileName('rapport-agents', startStr, endStr),
        agentsData.agents,
        [
          { key: 'name', label: 'Agent' },
          { key: 'email', label: 'Email' },
          { key: 'agent_type', label: 'Type' },
          { key: 'payment_count', label: 'Paiements' },
          { key: 'total_collected', label: 'Total encaissé' },
          { key: 'avg_payment', label: 'Moyenne', render: r => formatCurrency(r.avg_payment) },
          { key: 'last_payment_date', label: 'Dernier paiement', render: r => formatCsvDate(r.last_payment_date) },
        ]
      );
      toast.success('CSV agents téléchargé');
    } finally { setIsExporting(false); }
  };

  const handlePrint = () => {
    window.print();
  };

  const trendCalc = (current, previous) => {
    if (!previous || previous === 0) return null;
    return parseFloat(((current - previous) / previous * 100).toFixed(1));
  };

  const methodLabels = { cash: 'Espèces', mobile: 'Mobile Money', bank: 'Banque', card: 'Carte' };

  // --- Tab content renderers ---
  const renderOverviewTab = () => {
    if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;
    if (!overview) return <div className="text-center text-muted-foreground py-12">Sélectionnez une période pour afficher le rapport.</div>;

    const p = overview.payments;
    const m = overview.members;
    const d = overview.debts;
    const v = overview.vehicles;
    const doc = overview.documents;
    const cards = overview.cards;
    const pen = overview.penalties;
    const trend = trendCalc(p.total_collected, p.previous_collected);

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="lg:col-span-2 bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 shadow-lg text-primary-foreground">
            <span className="opacity-90 font-medium flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5" /> Revenu Total</span>
            <span className="text-4xl md:text-5xl font-extrabold">{formatCurrency(p.total_collected)}</span>
            {trend !== null && (
              <span className={`block mt-2 text-sm font-bold ${trend >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {trend >= 0 ? '+' : ''}{trend}% vs période précédente
              </span>
            )}
            <div className="flex gap-4 mt-3 text-sm opacity-80">
              <span>{p.total_payments} paiements</span>
              <span>{p.unique_payers} payeurs</span>
            </div>
          </div>
          <StatCard icon={CreditCard} label="Paiements" value={formatNumber(p.total_payments)} sub={`Moy. ${formatCurrency(p.avg_payment)}`} color="primary" />
          <StatCard icon={Users} label="Membres" value={`${m.active_members}`} sub={`/${m.total_members} total`} color="secondary" />
          <StatCard icon={BookOpen} label="Dettes ouvertes" value={formatCurrency(d.total_debt_remaining)} sub={`${d.open_debts} dettes`} color="warning" />
          <StatCard icon={Ban} label="Pénalités" value={formatNumber(pen.total_penalties)} sub={formatCurrency(pen.total_penalty_amount)} color="danger" />
        </div>

        {/* Payment method pie + daily chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {overview.payments.by_day?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm lg:col-span-2">
              <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> Évolution des Recettes
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={overview.payments.by_day.map(d => ({
                    date: new Date(d.payment_date + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
                    Revenu: d.total,
                  }))}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => formatCompactCurrency(v)} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, color: 'hsl(var(--foreground))' }}
                    formatter={v => [formatCurrency(v), 'Revenu']} />
                  <Bar dataKey="Revenu" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {overview.payments.by_method?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-primary" /> Modes de Paiement
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={overview.payments.by_method.map(m => ({ name: methodLabels[m.payment_method] || m.payment_method, value: parseFloat(m.total) }))}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value">
                    {overview.payments.by_method.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }}
                    formatter={v => [formatCurrency(v), 'Montant']} />
                  <Legend formatter={v => <span className="text-foreground text-sm">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" /> Résumé Rapide
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground text-sm">Véhicules actifs</span>
                <span className="font-bold">{v.active_vehicles}/{v.total_vehicles}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground text-sm">Documents expirés</span>
                <span className="font-bold text-red-500">{doc.expired_documents}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground text-sm">Cartes membres actives</span>
                <span className="font-bold">{cards.active_cards}/{cards.total_cards}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground text-sm">Pénalités payées</span>
                <span className="font-bold">{pen.paid_penalties}/{pen.total_penalties}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground text-sm">Nouveaux membres</span>
                <span className="font-bold">{m.active_members}</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderFinancesTab = () => {
    if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;

    return (
      <div className="space-y-8">
        {/* Payments section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" /> Encaissements
            </h2>
            <ExportButtons onPrint={handlePrint} onCsv={exportPaymentsCsv} isExporting={isExporting} />
          </div>
          {paymentsData ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <StatCard icon={TrendingUp} label="Total encaissé" value={formatCurrency(paymentsData.summary.total_collected)} sub={`${paymentsData.summary.total_payments} opérations`} color="primary" />
                <StatCard icon={Wallet} label="Moyenne" value={formatCurrency(paymentsData.summary.avg_payment)} sub={`${paymentsData.summary.unique_payers} payeurs`} color="success" />
                {paymentsData.by_method?.map((m, i) => (
                  <StatCard key={m.payment_method}
                    icon={CreditCard}
                    label={methodLabels[m.payment_method] || m.payment_method}
                    value={formatCurrency(m.total)}
                    sub={`${m.count} paiements`}
                    color={['secondary', 'warning', 'danger', 'purple'][i] || 'muted'}
                  />
                ))}
              </div>
              <div className="overflow-x-auto bg-card border border-border rounded-2xl p-4">
                <ReportDataTable
                  columns={[
                    { key: 'member_name', label: 'Membre' },
                    { key: 'amount', label: 'Montant', align: 'right', render: r => formatCurrency(r.amount) },
                    { key: 'payment_method', label: 'Méthode', render: r => methodLabels[r.payment_method] || r.payment_method },
                    { key: 'payment_date', label: 'Date' },
                    { key: 'parking_id', label: 'Parking' },
                  ]}
                  rows={paymentsData.rows || []}
                  emptyMessage="Aucun paiement trouvé pour cette période."
                />
              </div>
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8">Sélectionnez une période pour voir les encaissements.</div>
          )}
        </div>

        {/* Debts section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange-500" /> Dettes
            </h2>
            <ExportButtons onPrint={handlePrint} onCsv={exportDebtsCsv} isExporting={isExporting} csvLabel="CSV dettes" />
          </div>
          {debtsData ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <StatCard icon={BookOpen} label="Dettes ouvertes" value={debtsData.summary.pending_debts} sub={formatCurrency(debtsData.summary.total_remaining)} color="warning" />
                <StatCard icon={TrendingUp} label="Payées" value={debtsData.summary.paid_debts} sub={`/${debtsData.summary.total_debts} total`} color="success" />
                <StatCard icon={Ban} label="Partielles" value={debtsData.summary.partially_paid_debts} color="secondary" />
                <StatCard icon={AlertCircle} label="Annulées" value={debtsData.summary.written_off_debts} color="danger" />
              </div>
              {debtsData.top_debtors?.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="font-bold text-foreground mb-3">Top débiteurs</h3>
                  <ReportDataTable
                    columns={[
                      { key: 'member_name', label: 'Membre' },
                      { key: 'amount_original', label: 'Montant initial', align: 'right', render: r => formatCurrency(r.amount_original) },
                      { key: 'amount_remaining', label: 'Restant dû', align: 'right', render: r => formatCurrency(r.amount_remaining) },
                      { key: 'status', label: 'Statut', render: r => ({
                        pending: 'En attente', partially_paid: 'Partiel', paid: 'Payé', written_off: 'Annulé',
                      })[r.status] || r.status },
                    ]}
                    rows={debtsData.top_debtors}
                    emptyMessage="Aucune dette ouverte."
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8">Sélectionnez une période pour voir les dettes.</div>
          )}
        </div>

        {/* Penalties receipt summary from overview */}
        {overview && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Ban className="w-4 h-4 text-red-500" /> Pénalités
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-muted-foreground block">Total pénalités</span>
                <span className="text-xl font-bold text-foreground">{overview.penalties.total_penalties}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Montant total</span>
                <span className="text-xl font-bold text-foreground">{formatCurrency(overview.penalties.total_penalty_amount)}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Payées</span>
                <span className="text-xl font-bold text-green-500">{overview.penalties.paid_penalties}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTerrainTab = () => {
    if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;

    return (
      <div className="space-y-6">
        {transportData ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={MapPin} label="Parkings actifs" value={`${transportData.parkings.active_parkings}/${transportData.parkings.total_parkings}`} color="primary" />
              <StatCard icon={Route} label="Lignes actives" value={`${transportData.lines.active_lines}/${transportData.lines.total_lines}`} color="secondary" />
              <StatCard icon={Car} label="Véhicules actifs" value={`${transportData.vehicles.active_vehicles}/${transportData.vehicles.total_vehicles}`} color="success" />
              <StatCard icon={ClipboardCheck} label="Affectations actives" value={`${transportData.assignments.active_assignments}/${transportData.assignments.total_assignments}`} color="warning" />
            </div>

            {/* Vehicles by type */}
            {transportData.vehicles.by_type?.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Car className="w-4 h-4 text-primary" /> Véhicules par type
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {transportData.vehicles.by_type.map((vt, i) => (
                    <div key={i} className="bg-muted/30 rounded-xl p-3 flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">{vt.type_name || 'Non spécifié'}</span>
                      <span className="text-lg font-bold text-primary">{vt.type_count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents status */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-4 h-5 text-destructive" /> Statut des documents
              </h3>
              {transportData.documents.total_documents > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-green-500/10 rounded-xl p-4 text-center">
                    <span className="text-2xl font-extrabold text-green-500 block">{transportData.documents.valid_documents}</span>
                    <span className="text-xs text-muted-foreground">Valides</span>
                  </div>
                  <div className="bg-orange-500/10 rounded-xl p-4 text-center">
                    <span className="text-2xl font-extrabold text-orange-500 block">{transportData.documents.expiring_soon_documents}</span>
                    <span className="text-xs text-muted-foreground">Expire bientôt</span>
                  </div>
                  <div className="bg-red-500/10 rounded-xl p-4 text-center">
                    <span className="text-2xl font-extrabold text-red-500 block">{transportData.documents.expired_documents}</span>
                    <span className="text-xs text-muted-foreground">Expirés</span>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <span className="text-2xl font-extrabold text-foreground block">{transportData.documents.total_documents}</span>
                    <span className="text-xs text-muted-foreground">Total</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun document enregistré.</p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground py-12">Chargement des données terrain...</div>
        )}
      </div>
    );
  };

  const renderMembersTab = () => {
    if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;

    return (
      <div className="space-y-6">
        {membersData ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Membres total" value={formatNumber(membersData.summary.total_members)} color="primary" />
              <StatCard icon={Users} label="Membres actifs" value={formatNumber(membersData.summary.active_members)} sub={formatPercent(membersData.summary.active_members / membersData.summary.total_members * 100)} color="success" />
              <StatCard icon={Ban} label="Suspendus" value={formatNumber(membersData.summary.suspended_members)} color="danger" />
              <StatCard icon={TrendingUp} label="Nouveaux (période)" value={formatNumber(membersData.summary.new_members)} color="secondary" />
              <StatCard icon={BookOpen} label="Avec dette" value={formatNumber(membersData.summary.members_with_debt)} color="warning" />
              <StatCard icon={CreditCard} label="Avec carte active" value={formatNumber(membersData.summary.members_with_card)} color="success" />
              <StatCard icon={AlertCircle} label="Sans carte" value={formatNumber(membersData.summary.members_without_card)} color="danger" />
            </div>

            {membersData.by_parking?.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-5 text-primary" /> Membres par parking
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {membersData.by_parking.map((p, i) => (
                    <div key={i} className="bg-muted/30 rounded-xl p-3 flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">{p.parking_name || 'Non attribué'}</span>
                      <span className="text-lg font-bold text-primary">{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-muted-foreground py-12">Chargement des données membres...</div>
        )}
      </div>
    );
  };

  const renderAgentsTab = () => {
    if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;

    return (
      <div className="space-y-6">
        <ExportButtons onPrint={handlePrint} onCsv={exportAgentsCsv} isExporting={isExporting} csvLabel="CSV agents" />
        {agentsData ? (
          agentsData.agents?.length > 0 ? (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <ReportDataTable
                columns={[
                  { key: 'name', label: 'Agent' },
                  { key: 'agent_type', label: 'Type', render: r => ({
                    field_collector: 'Terrain', office_collector: 'Bureau',
                  })[r.agent_type] || r.agent_type },
                  { key: 'payment_count', label: 'Paiements', align: 'right' },
                  { key: 'total_collected', label: 'Total encaissé', align: 'right', render: r => formatCurrency(r.total_collected) },
                  { key: 'avg_payment', label: 'Moyenne', align: 'right', render: r => formatCurrency(r.avg_payment) },
                  { key: 'last_payment_date', label: 'Dernier', render: r => r.last_payment_date ? new Date(r.last_payment_date + 'T00:00:00').toLocaleDateString('fr-FR') : '—' },
                ]}
                rows={agentsData.agents}
                emptyMessage="Aucun agent trouvé."
              />
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">Aucun agent trouvé pour cette organisation.</div>
          )
        ) : (
          <div className="text-center text-muted-foreground py-8">Chargement des performances agents...</div>
        )}
      </div>
    );
  };

  const renderExportsTab = () => {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground text-sm">Téléchargez les rapports complets au format CSV compatible Excel. Les fichiers incluent les accents et caractères spéciaux français.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Encaissements', desc: 'Tous les paiements avec membre, montant, méthode, date', icon: DollarSign, action: exportPaymentsCsv, color: 'from-primary to-secondary' },
            { label: 'Dettes', desc: 'Top débiteurs avec montants initiaux et restants', icon: BookOpen, action: exportDebtsCsv, color: 'from-orange-500 to-red-500' },
            { label: 'Agents', desc: 'Performances des agents : paiements, montants, activité', icon: UserCircle, action: exportAgentsCsv, color: 'from-purple-500 to-pink-500' },
            { label: 'Rapport complet', desc: 'Imprimez le rapport complet (toutes les sections)', icon: Printer, action: handlePrint, color: 'from-green-500 to-teal-500' },
          ].map((item, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={item.action}
              disabled={isExporting}
              className={`bg-gradient-to-br ${item.color} rounded-2xl p-5 text-white text-left shadow-lg disabled:opacity-50`}
            >
              <item.icon className="w-6 h-6 mb-3 opacity-90" />
              <h3 className="font-bold text-lg mb-1">{item.label}</h3>
              <p className="text-sm opacity-80">{item.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col print:bg-white">
      <div className="no-print">
        <Header />
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="no-print">
          <AppSidebar />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-16 lg:pb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
            <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 no-print">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2">Rapports & Analyses</h1>
                <p className="text-muted-foreground text-sm">
                  {formatPeriod(startStr, endStr)} {isSuperAdmin && orgId ? '— Organisation filtrée' : ''}
                </p>
              </div>
              <ExportButtons onPrint={handlePrint} onCsv={activeTab === 'finances' ? exportPaymentsCsv : activeTab === 'agents' ? exportAgentsCsv : activeTab === 'members' ? exportDebtsCsv : undefined} isExporting={isExporting} />
            </header>

            {/* Tabs */}
            <div className="no-print">
              <div className="flex gap-1 bg-card border border-border p-1 rounded-xl mb-6 overflow-x-auto">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'bg-primary text-primary-foreground shadow'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                  </button>
                ))}
              </div>

              {/* Filters */}
              {activeTab !== 'exports' && (
                <div className="mb-6">
                  <ReportFilters
                    selectedPeriod={selectedPeriod}
                    setSelectedPeriod={setSelectedPeriod}
                    customStart={customStart}
                    setCustomStart={setCustomStart}
                    customEnd={customEnd}
                    setCustomEnd={setCustomEnd}
                    parkingFilter={parkingFilter}
                    setParkingFilter={setParkingFilter}
                    agentFilter={agentFilter}
                    setAgentFilter={setAgentFilter}
                    methodFilter={methodFilter}
                    setMethodFilter={setMethodFilter}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    parkings={parkings}
                    agents={agents}
                    showParking={activeTab === 'finances'}
                    showAgent={activeTab === 'finances'}
                    showMethod={activeTab === 'finances'}
                    showStatus={activeTab === 'finances'}
                  />
                </div>
              )}
            </div>

            {/* Tab content */}
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'finances' && renderFinancesTab()}
            {activeTab === 'terrain' && renderTerrainTab()}
            {activeTab === 'members' && renderMembersTab()}
            {activeTab === 'agents' && renderAgentsTab()}
            {activeTab === 'exports' && renderExportsTab()}

            {/* Show loading on tab switch */}
            {isLoading && activeTab !== 'overview' && activeTab !== 'exports' && activeTab !== 'terrain' && (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default ReportsPage;
