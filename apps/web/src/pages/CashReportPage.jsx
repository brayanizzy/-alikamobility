import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import pb from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import StatCard from '@/components/dashboard/StatCard.jsx';
import ReportDataTable from '@/components/reports/ReportDataTable.jsx';
import ExportButtons from '@/components/reports/ExportButtons.jsx';
import { downloadCsv, formatCsvDate, formatCsvFileName } from '@/utils/exportCsv.js';
import { formatPeriod } from '@/utils/reportFormatters.js';
import { formatCurrency } from '@/utils/currency.js';
import { Loader2, DollarSign, TrendingUp, Wallet, CreditCard, Smartphone, Banknote, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const PERIODS = [
  { key: 'day', label: "Aujourd'hui" },
  { key: 'week', label: '7 jours' },
  { key: 'month', label: '30 jours' },
  { key: 'custom', label: 'Personnalisé' },
];

const CashReportPage = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [data, setData] = useState(null);

  const getDateRange = useCallback(() => {
    const now = new Date();
    const start = new Date();
    if (selectedPeriod === 'week') start.setDate(now.getDate() - 7);
    else if (selectedPeriod === 'month') start.setMonth(now.getMonth() - 1);
    else if (selectedPeriod === 'day') start.setDate(now.getDate() - 1);
    else if (selectedPeriod === 'custom') return { startStr: customStart, endStr: customEnd };
    return { startStr: start.toISOString().split('T')[0], endStr: now.toISOString().split('T')[0] };
  }, [selectedPeriod, customStart, customEnd]);

  useEffect(() => {
    if (selectedPeriod === 'custom' && (!customStart || !customEnd)) return;
    const { startStr, endStr } = getDateRange();
    setIsLoading(true);
    pb.request('/reports/cashier', { params: { from: startStr, to: endStr } })
      .then(setData)
      .catch(() => toast.error('Erreur chargement rapport de caisse'))
      .finally(() => setIsLoading(false));
  }, [selectedPeriod, customStart, customEnd, getDateRange]);

  const handlePrint = () => window.print();

  const exportCsv = () => {
    if (!data?.payments?.length) { toast.error('Aucune donnée à exporter'); return; }
    setIsExporting(true);
    try {
      const { startStr, endStr } = getDateRange();
      downloadCsv(
        formatCsvFileName('rapport-caisse', startStr, endStr),
        data.payments,
        [
          { key: 'member_name', label: 'Membre' },
          { key: 'amount', label: 'Montant', render: r => formatCurrency(r.amount) },
          { key: 'payment_method', label: 'Méthode' },
          { key: 'payment_date', label: 'Date', render: r => formatCsvDate(r.payment_date) },
          { key: 'created', label: 'Enregistré le', render: r => formatCsvDate(r.created) },
        ]
      );
      toast.success('CSV téléchargé');
    } finally { setIsExporting(false); }
  };

  const { startStr, endStr } = getDateRange();
  const methodLabels = { cash: 'Espèces', mobile: 'Mobile Money', bank: 'Banque', card: 'Carte' };

  return (
    <div className="min-h-screen bg-background flex flex-col print:bg-white">
      <div className="no-print"><Header /></div>
      <div className="flex-1 flex overflow-hidden">
        <div className="no-print"><AppSidebar /></div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-16 lg:pb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
            <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 no-print">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2">Rapport de Caisse</h1>
                <p className="text-muted-foreground text-sm">{formatPeriod(startStr, endStr)}</p>
              </div>
              <ExportButtons onPrint={handlePrint} onCsv={exportCsv} isExporting={isExporting} />
            </header>

            {/* Period filter */}
            <div className="flex flex-wrap gap-3 mb-6 no-print">
              <div className="flex gap-1 bg-card border border-border p-1 rounded-xl">
                {PERIODS.map(p => (
                  <button key={p.key} onClick={() => setSelectedPeriod(p.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedPeriod === p.key ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                    }`}>
                    {p.label}
                  </button>
                ))}
              </div>
              {selectedPeriod === 'custom' && (
                <>
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                    className="bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-36" />
                  <span className="text-muted-foreground text-xs">à</span>
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                    className="bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-36" />
                </>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
            ) : data ? (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="lg:col-span-2 bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 shadow-lg text-primary-foreground">
                    <span className="opacity-90 font-medium flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5" /> Total Encaissé
                    </span>
                    <span className="text-4xl md:text-5xl font-extrabold">{formatCurrency(data.summary.total_collected)}</span>
                    <div className="flex gap-4 mt-3 text-sm opacity-80">
                      <span>{data.summary.total_payments} opérations</span>
                      <span>Moy. {formatCurrency(data.summary.avg_payment)}</span>
                    </div>
                  </div>
                  <StatCard icon={Wallet} label="Espèces" value={formatCurrency(data.summary.cash_total)} color="success" />
                  <StatCard icon={Smartphone} label="Mobile Money" value={formatCurrency(data.summary.mobile_total)} color="secondary" />
                  <StatCard icon={Banknote} label="Banque" value={formatCurrency(data.summary.bank_total)} color="warning" />
                  <StatCard icon={CreditCard} label="Autres" value={formatCurrency(data.summary.other_total)} color="muted" />
                </div>

                {/* Daily breakdown */}
                {data.by_day?.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl p-5 mb-6">
                    <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" /> Évolution journalière
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                      {data.by_day.map((d, i) => (
                        <div key={i} className="bg-muted/30 rounded-xl p-3 text-center">
                          <span className="text-xs text-muted-foreground block">
                            {new Date(d.payment_date + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-lg font-bold text-foreground block mt-1">{formatCurrency(d.total)}</span>
                          <span className="text-xs text-muted-foreground">{d.count} op.</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent payments */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-border">
                    <h3 className="font-bold text-foreground">Opérations récentes</h3>
                  </div>
                  <ReportDataTable
                    columns={[
                      { key: 'member_name', label: 'Membre' },
                      { key: 'amount', label: 'Montant', align: 'right', render: r => formatCurrency(r.amount) },
                      { key: 'payment_method', label: 'Méthode', render: r => methodLabels[r.payment_method] || r.payment_method },
                      { key: 'payment_date', label: 'Date' },
                      { key: 'created', label: 'Enregistré', render: r => new Date(r.created).toLocaleString('fr-FR') },
                    ]}
                    rows={data.payments || []}
                    emptyMessage="Aucune opération trouvée pour cette période."
                  />
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-12">Sélectionnez une période pour afficher le rapport.</div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default CashReportPage;
