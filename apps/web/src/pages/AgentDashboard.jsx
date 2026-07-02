import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { formatCurrency } from '@/utils/currency.js';
import { isOfficeCollector } from '@/utils/roles.js';
import {
  ScanLine, Users, History, Loader2, AlertCircle, MapPin, User,
  TrendingUp, DollarSign, ChevronRight, Clock, Activity, Bell,
  Smartphone, Landmark, Receipt, Ban, CheckCircle2
} from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

const AgentDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({ count: 0, sum: 0, cashSum: 0, mobileSum: 0, cashCount: 0, mobileCount: 0 });
  const [parkingName, setParkingName] = useState('');
  const [dailyTarget, setDailyTarget] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [notifCount, setNotifCount] = useState(0);
  const officeMode = isOfficeCollector(currentUser);

  useEffect(() => {
    const fetchTodayStats = async () => {
      try {
        setError('');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const orgId = currentUser.organization_id;

        const [allTodayRes, notifRes] = await Promise.all([
          pb.collection('payments').getList(1, 500, {
            filter: `organization_id = "${orgId}" && recorded_by = "${currentUser.name || currentUser.email}" && payment_date >= "${todayStr}" && payment_date < "${tomorrowStr}"`,
            sort: '-created',
            $autoCancel: false
          }),
          pb.collection('notifications').getList(1, 1, {
            filter: `organization_id = "${orgId}" && read = false`,
            $autoCancel: false
          }).catch(() => ({ totalItems: 0 })),
        ]);

        const todayItems = allTodayRes.items || [];
        const cashPayments = todayItems.filter(p => p.payment_method === 'cash');
        const mobilePayments = todayItems.filter(p => p.payment_method === 'mobile_money');

        setStats({
          count: todayItems.length,
          sum: todayItems.reduce((acc, curr) => acc + curr.amount, 0),
          cashSum: cashPayments.reduce((acc, curr) => acc + curr.amount, 0),
          mobileSum: mobilePayments.reduce((acc, curr) => acc + curr.amount, 0),
          cashCount: cashPayments.length,
          mobileCount: mobilePayments.length,
        });

        setNotifCount(notifRes.totalItems || 0);

        if (currentUser.parking_id) {
          const parking = await pb.collection('parkings').getOne(currentUser.parking_id, { $autoCancel: false });
          setParkingName(parking.name || '');
          setDailyTarget(Number(parking.daily_target) || 0);
        }
      } catch (e) {
        console.error(e);
        setError("Impossible de charger votre tableau de bord. Vérifiez la connexion puis réessayez.");
      } finally {
        setLoading(false);
      }
    };
    fetchTodayStats();
  }, [currentUser]);

  const progressPercent = dailyTarget > 0 ? Math.min((stats.sum / dailyTarget) * 100, 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-bold">{error}</p>
          <button onClick={() => { setError(''); setLoading(true); window.location.reload(); }}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <Header />

      <main className="flex-1 px-4 py-6 flex flex-col max-w-lg mx-auto w-full">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex-1 flex flex-col"
        >
          {/* Profile Header */}
          <motion.div variants={item} className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold tracking-wide mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              {officeMode ? 'MODE BUREAU' : 'TERRAIN'}
            </div>
            <div className="mx-auto mb-2 h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary overflow-hidden border-2 border-border flex items-center justify-center shadow-elevated">
              {currentUser.avatar ? (
                <img src={pb.getFileUrl(currentUser, currentUser.avatar)} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-primary-foreground">
                  {(currentUser.name || currentUser.email || 'A').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <h1 className="text-xl font-extrabold text-foreground mb-1">
              {currentUser.name || currentUser.email?.split('@')[0]}
            </h1>
            <div className="flex flex-wrap justify-center gap-2 text-xs font-medium">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-primary font-semibold">
                {officeMode ? 'Agent Bureau' : 'Agent Terrain'}
              </span>
              {parkingName && (
                <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {parkingName}
                </span>
              )}
              {notifCount > 0 && (
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-500 inline-flex items-center gap-1 font-bold">
                  <Bell className="h-3 w-3" /> {notifCount}
                </span>
              )}
            </div>
          </motion.div>

          {/* Performance Card */}
          <motion.div variants={item}
            className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 mb-4 text-primary-foreground shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-primary-foreground/80 font-medium flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4" /> Aujourd'hui
                </span>
                <span className="text-primary-foreground/60 text-xs">
                  {stats.count} encaissement{stats.count > 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-4xl font-extrabold tracking-tight">
                {formatCurrency(stats.sum)}
              </span>

              {dailyTarget > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-primary-foreground/70 mb-1.5">
                    <span>Objectif: {formatCurrency(dailyTarget)}</span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-2.5 bg-black/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-white/80 rounded-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Split Cash/Mobile for office_collector */}
          {officeMode && (
            <motion.div variants={item} className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-card border border-border rounded-2xl p-4 shadow-card">
                <div className="flex items-center gap-2 mb-1">
                  <Landmark className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Cash</span>
                </div>
                <span className="text-xl font-bold text-foreground">{formatCurrency(stats.cashSum)}</span>
                <span className="text-xs text-muted-foreground block">{stats.cashCount} opération{stats.cashCount > 1 ? 's' : ''}</span>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 shadow-card">
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Mobile Money</span>
                </div>
                <span className="text-xl font-bold text-foreground">{formatCurrency(stats.mobileSum)}</span>
                <span className="text-xs text-muted-foreground block">{stats.mobileCount} opération{stats.mobileCount > 1 ? 's' : ''}</span>
              </div>
            </motion.div>
          )}

          {/* Field collector quick stats */}
          {!officeMode && (
            <motion.div variants={item} className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-card border border-border rounded-2xl p-4 shadow-card">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Total</span>
                </div>
                <span className="text-xl font-bold text-foreground">{formatCurrency(stats.sum)}</span>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 shadow-card">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-secondary" />
                  <span className="text-xs text-muted-foreground">Opérations</span>
                </div>
                <span className="text-xl font-bold text-foreground">{stats.count}</span>
              </div>
            </motion.div>
          )}

          {/* Navigation Cards */}
          <motion.div variants={item} className="grid grid-cols-2 gap-3 flex-1 content-start pb-4">
            {officeMode ? (
              <>
                <Link to="/members"
                  className="col-span-2 bg-primary text-primary-foreground rounded-2xl p-5 shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
                    <Users className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <span className="block text-xl font-extrabold">Membres</span>
                    <span className="text-primary-foreground/70 text-xs">Gérer les membres au bureau</span>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-60" />
                </Link>

                <Link to="/payment-history"
                  className="bg-card border border-border rounded-2xl p-4 hover:bg-muted/50 active:scale-[0.97] transition-all flex flex-col items-center justify-center gap-2 shadow-card"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="font-bold text-xs text-foreground">Reçus</span>
                </Link>

                <Link to="/late-payments"
                  className="bg-card border border-border rounded-2xl p-4 hover:bg-muted/50 active:scale-[0.97] transition-all flex flex-col items-center justify-center gap-2 shadow-card"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Ban className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="font-bold text-xs text-foreground">Dettes</span>
                </Link>

                <Link to="/members-list"
                  className="bg-card border border-border rounded-2xl p-4 hover:bg-muted/50 active:scale-[0.97] transition-all flex flex-col items-center justify-center gap-2 shadow-card"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-secondary" />
                  </div>
                  <span className="font-bold text-xs text-foreground">Annuaire</span>
                </Link>

                <Link to="/notifications"
                  className="bg-card border border-border rounded-2xl p-4 hover:bg-muted/50 active:scale-[0.97] transition-all flex flex-col items-center justify-center gap-2 shadow-card"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="font-bold text-xs text-foreground">Alertes</span>
                  {notifCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                      {notifCount}
                    </span>
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link to="/scanner"
                  className="col-span-2 bg-primary text-primary-foreground rounded-2xl p-5 shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
                    <ScanLine className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <span className="block text-xl font-extrabold">Encaisser</span>
                    <span className="text-primary-foreground/70 text-xs">Scanner le QR code d'un membre</span>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-60" />
                </Link>

                <Link to="/members-list"
                  className="bg-card border border-border rounded-2xl p-4 hover:bg-muted/50 active:scale-[0.97] transition-all flex flex-col items-center justify-center gap-2 shadow-card"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-secondary" />
                  </div>
                  <span className="font-bold text-xs text-foreground">Membres</span>
                </Link>

                <Link to="/late-payments"
                  className="bg-card border border-border rounded-2xl p-4 hover:bg-muted/50 active:scale-[0.97] transition-all flex flex-col items-center justify-center gap-2 shadow-card"
                >
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <History className="w-5 h-5 text-destructive" />
                  </div>
                  <span className="font-bold text-xs text-foreground">Retards</span>
                </Link>

                <Link to="/payment-history"
                  className="bg-card border border-border rounded-2xl p-4 hover:bg-muted/50 active:scale-[0.97] transition-all flex flex-col items-center justify-center gap-2 shadow-card"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="font-bold text-xs text-foreground">Historique</span>
                </Link>

                <Link to="/notifications"
                  className="bg-card border border-border rounded-2xl p-4 hover:bg-muted/50 active:scale-[0.97] transition-all flex flex-col items-center justify-center gap-2 shadow-card relative"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="font-bold text-xs text-foreground">Notifs</span>
                  {notifCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                      {notifCount}
                    </span>
                  )}
                </Link>
              </>
            )}
          </motion.div>

          {/* Sync indicator */}
          <motion.div variants={item} className="mb-4">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              <span>Synchronisé</span>
              <span className="text-muted-foreground/50">•</span>
              <span className="text-muted-foreground/70">{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default AgentDashboard;
