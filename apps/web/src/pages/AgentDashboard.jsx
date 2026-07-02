import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { formatCurrency } from '@/utils/currency.js';
import { AGENT_TYPE_LABELS, isOfficeCollector } from '@/utils/roles.js';
import {
  ScanLine, Users, History, Loader2, AlertCircle, MapPin, User,
  TrendingUp, DollarSign, ChevronRight, Clock, Activity, Bell
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
  const [stats, setStats] = useState({ count: 0, sum: 0 });
  const [parkingName, setParkingName] = useState('');
  const [dailyTarget, setDailyTarget] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
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

        const allToday = await pb.collection('payments').getList(1, 500, {
          filter: `organization_id = "${currentUser.organization_id}" && recorded_by = "${currentUser.name || currentUser.email}" && payment_date >= "${todayStr}" && payment_date < "${tomorrowStr}"`,
          sort: '-created',
          $autoCancel: false
        });

        const todayItems = allToday.items || [];
        setStats({
          count: todayItems.length,
          sum: todayItems.reduce((acc, curr) => acc + curr.amount, 0)
        });

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-6 flex flex-col max-w-lg mx-auto w-full">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex-1 flex flex-col"
        >
          {/* Profile Header */}
          <motion.div variants={item} className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold tracking-wide mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              SYSTÈME OPÉRATIONNEL
            </div>
            <div className="mx-auto mb-3 h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-secondary overflow-hidden border-2 border-border flex items-center justify-center shadow-elevated">
              {currentUser.avatar ? (
                <img src={pb.getFileUrl(currentUser, currentUser.avatar)} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-primary-foreground">
                  {(currentUser.name || currentUser.email || 'A').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-foreground mb-1">
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
            </div>
          </motion.div>

          {loading && (
            <div className="py-12 flex justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Chargement du tableau de bord...</p>
              </div>
            </div>
          )}

          {error && (
            <motion.div variants={item}
              className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Erreur</p>
                <p className="text-destructive/80 mt-0.5">{error}</p>
              </div>
            </motion.div>
          )}

          {!loading && !error && (
            <>
              {/* Performance Card */}
              <motion.div variants={item}
                className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 mb-4 text-primary-foreground shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-primary-foreground/80 font-medium flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4" /> Performance Jour
                    </span>
                    <span className="text-primary-foreground/60 text-xs">
                      {stats.count} encaissement{stats.count > 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-4xl font-extrabold tracking-tight">
                    {formatCurrency(stats.sum)}
                  </span>

                  {/* Progress bar if target exists */}
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

              {/* Quick Stats */}
              <motion.div variants={item} className="grid grid-cols-2 gap-3 mb-6">
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

              {/* Navigation Cards */}
              <motion.div variants={item} className="grid grid-cols-2 gap-3 flex-1 content-start pb-4">
                {officeMode ? (
                  <Link to="/members"
                    className="col-span-2 bg-primary text-primary-foreground rounded-2xl p-6 shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-4"
                  >
                    <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center">
                      <Users className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <span className="block text-2xl font-extrabold">Membres</span>
                      <span className="text-primary-foreground/70 text-sm">Gérer les membres au bureau</span>
                    </div>
                    <ChevronRight className="w-6 h-6 opacity-60" />
                  </Link>
                ) : (
                  <Link to="/scanner"
                    className="col-span-2 bg-primary text-primary-foreground rounded-2xl p-6 shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-4"
                  >
                    <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center">
                      <ScanLine className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <span className="block text-2xl font-extrabold">Encaisser</span>
                      <span className="text-primary-foreground/70 text-sm">Scanner le QR code d'un membre</span>
                    </div>
                    <ChevronRight className="w-6 h-6 opacity-60" />
                  </Link>
                )}

                <Link to="/members-list"
                  className="bg-card border border-border rounded-2xl p-5 hover:bg-muted/50 active:scale-[0.97] transition-all flex flex-col items-center justify-center gap-3 shadow-card"
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                  <span className="font-bold text-sm text-foreground">Membres</span>
                </Link>

                <Link to="/late-payments"
                  className="bg-card border border-border rounded-2xl p-5 hover:bg-muted/50 active:scale-[0.97] transition-all flex flex-col items-center justify-center gap-3 shadow-card"
                >
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <History className="w-6 h-6 text-destructive" />
                  </div>
                  <span className="font-bold text-sm text-foreground">Retards</span>
                </Link>

                <Link to="/payment-history"
                  className="bg-card border border-border rounded-2xl p-5 hover:bg-muted/50 active:scale-[0.97] transition-all flex flex-col items-center justify-center gap-3 shadow-card"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="font-bold text-sm text-foreground">Historique</span>
                </Link>

                <Link to="/profile"
                  className="bg-card border border-border rounded-2xl p-5 hover:bg-muted/50 active:scale-[0.97] transition-all flex flex-col items-center justify-center gap-3 shadow-card"
                >
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <User className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <span className="font-bold text-sm text-foreground">Mon Profil</span>
                </Link>

                <Link to="/notifications"
                  className="bg-card border border-border rounded-2xl p-5 hover:bg-muted/50 active:scale-[0.97] transition-all flex flex-col items-center justify-center gap-3 shadow-card"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="font-bold text-sm text-foreground">Notifications</span>
                </Link>
              </motion.div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default AgentDashboard;