
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { generateDailyReport } from '@/utils/DailyReportPDF.jsx';
import { Users, CreditCard, MapPin, BarChart3, Loader2, ArrowUpRight, AlertCircle, Percent, FileText } from 'lucide-react';
import { toast } from 'sonner';

const AdminAssociationDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({ members: 0, todayPayments: 0, todayRevenue: 0, arrieres: 0, recoveryRate: 0 });
  const [recentPayments, setRecentPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const fetchData = async () => {
    try {
      const orgId = currentUser.organization_id;

      const membersRes = await pb.collection('members').getList(1, 1, {
        filter: `organization_id = "${orgId}"`,
        $autoCancel: false
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Using getFullList is safe for standard operations, but we might want pagination for huge datasets
      const paymentsRes = await pb.collection('payments').getFullList({
        filter: `organization_id = "${orgId}"`,
        sort: '-created',
        expand: 'member_id',
        $autoCancel: false
      });

      const todayPayments = paymentsRes.filter(p => p.payment_date >= todayStr && p.payment_date < tomorrowStr);
      const todayRevenue = todayPayments.reduce((sum, p) => sum + p.amount, 0);
      
      const mockArrieres = membersRes.totalItems * 5000; 
      const mockRecoveryRate = 78.4; 

      setStats({
        members: membersRes.totalItems,
        todayPayments: todayPayments.length,
        todayRevenue: todayRevenue,
        arrieres: mockArrieres,
        recoveryRate: mockRecoveryRate
      });

      // Fetch member names for recent payments if not expanded
      const membersMap = {};
      const members = await pb.collection('members').getFullList({filter: `organization_id = "${orgId}"`, $autoCancel: false});
      members.forEach(m => membersMap[m.id] = m.name);

      const enrichedPayments = todayPayments.slice(0, 5).map(p => ({
        ...p,
        memberName: membersMap[p.member_id] || 'Inconnu'
      }));

      setRecentPayments(enrichedPayments);

    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.organization_id) {
      fetchData();
      
      // Simple simulated real-time update every 15s to keep UI fresh
      const interval = setInterval(fetchData, 15000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleExportReport = async () => {
    setIsGeneratingPDF(true);
    toast.info("Génération du rapport en cours...");
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const paymentsRes = await pb.collection('payments').getFullList({
        filter: `organization_id = "${currentUser.organization_id}" && payment_date >= "${todayStr}" && payment_date < "${tomorrowStr}" && status="paid"`,
        sort: 'created',
        $autoCancel: false
      });

      const membersMap = {};
      const members = await pb.collection('members').getFullList({filter: `organization_id = "${currentUser.organization_id}"`, $autoCancel: false});
      members.forEach(m => { membersMap[m.id] = m; });

      const reportData = {
        payments: paymentsRes.map(p => ({
          ...p,
          memberName: membersMap[p.member_id]?.name || 'Inconnu',
          motoNumber: membersMap[p.member_id]?.moto_number || 'N/A'
        })),
        totalAmount: paymentsRes.reduce((sum, p) => sum + p.amount, 0)
      };

      // Get org name
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

  if (isLoading && stats.members === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex-1 flex overflow-hidden relative">
        <aside className="w-64 border-r border-border bg-card/80 backdrop-blur z-10 hidden md:flex flex-col">
          <div className="p-6 flex-1">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-4">Panel Association</h2>
            <nav className="space-y-2">
              <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 bg-primary/20 text-primary rounded-lg font-medium transition-colors">
                <BarChart3 className="w-4 h-4" /> Vue d'ensemble
              </Link>
              <Link to="/members" className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                <Users className="w-4 h-4" /> Gestion Membres
              </Link>
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                <MapPin className="w-4 h-4" /> Parkings
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                <BarChart3 className="w-4 h-4" /> Rapports
              </a>
            </nav>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 z-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
            
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2">Tableau de Bord</h1>
                <p className="text-muted-foreground text-lg">Performances et métriques de la journée.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button 
                  onClick={handleExportReport}
                  disabled={isGeneratingPDF}
                  className="bg-secondary text-secondary-foreground font-bold px-6 py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-secondary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileText className="w-4 h-4" />} Exporter Rapport
                </button>
                <Link to="/members" className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                  Gestion Membres <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </header>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <motion.div 
                key={stats.todayRevenue}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="lg:col-span-2 bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 shadow-lg relative overflow-hidden group text-primary-foreground"
              >
                <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
                <div className="flex flex-col h-full relative z-10">
                  <span className="text-primary-foreground/90 font-medium mb-2 flex items-center gap-2 text-lg">
                    <BarChart3 className="w-5 h-5" /> Revenu du Jour
                  </span>
                  <span className="text-5xl md:text-6xl font-extrabold mt-auto tracking-tight">
                    {stats.todayRevenue.toLocaleString()} <span className="text-2xl opacity-80">XAF</span>
                  </span>
                </div>
              </motion.div>

              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                 <span className="text-muted-foreground font-medium mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" /> Paiements (Jour)
                  </span>
                  <span className="text-4xl font-extrabold text-foreground mt-auto">{stats.todayPayments}</span>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                 <span className="text-muted-foreground font-medium mb-2 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-secondary" /> Recouvrement
                  </span>
                  <span className="text-4xl font-extrabold text-foreground mt-auto">{stats.recoveryRate}%</span>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                 <span className="text-muted-foreground font-medium mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" /> Total Membres
                  </span>
                  <span className="text-4xl font-extrabold text-foreground mt-auto">{stats.members}</span>
              </div>

               <div className="lg:col-span-3 bg-destructive/10 border border-destructive/20 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div>
                    <span className="text-destructive font-medium mb-1 flex items-center gap-2 text-lg">
                      <AlertCircle className="w-5 h-5" /> Arriérés Totaux
                    </span>
                    <p className="text-muted-foreground text-sm">Somme des cotisations impayées à ce jour.</p>
                 </div>
                  <span className="text-4xl font-extrabold text-destructive text-right">
                    {stats.arrieres.toLocaleString()} XAF
                  </span>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h3 className="text-xl font-bold text-foreground">Transactions Récentes (Jour)</h3>
              </div>
              
              <div className="divide-y divide-border">
                {recentPayments.length === 0 ? (
                  <div className="p-12 flex flex-col items-center justify-center text-center">
                    <CreditCard className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-foreground font-medium text-lg">Aucun paiement aujourd'hui</p>
                  </div>
                ) : (
                  recentPayments.map((payment) => (
                    <div key={payment.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{payment.memberName}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.created).toLocaleTimeString()} • Mode: {payment.payment_method}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-lg text-primary">+{payment.amount}</span>
                        <span className="text-xs uppercase tracking-wider font-bold text-green-500">Encaissé</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminAssociationDashboard;
