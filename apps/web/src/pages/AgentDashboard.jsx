
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { ScanLine, Users, History, Loader2 } from 'lucide-react';

const AgentDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({ count: 0, sum: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodayStats = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const records = await pb.collection('payments').getFullList({
          filter: `organization_id = "${currentUser.organization_id}" && recorded_by = "${currentUser.name || currentUser.email}" && payment_date >= "${todayStr}" && payment_date < "${tomorrowStr}"`,
          $autoCancel: false
        });

        setStats({
          count: records.length,
          sum: records.reduce((acc, curr) => acc + curr.amount, 0)
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTodayStats();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 p-4 md:p-8 flex flex-col max-w-lg mx-auto w-full">
        <header className="mb-8 text-center mt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-sm font-bold tracking-wide mb-6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            SYSTÈME OPÉRATIONNEL
          </div>
          <h1 className="text-3xl font-extrabold text-foreground mb-2">Portail Recouvreur</h1>
          <p className="text-muted-foreground font-medium">Agent: {currentUser.name || currentUser.email}</p>
        </header>

        {!loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-4 mb-6 flex justify-between items-center shadow-sm">
            <div>
              <p className="text-sm text-muted-foreground">Performance Jour</p>
              <p className="text-xl font-bold text-primary">{stats.sum.toLocaleString()} XAF</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Encaissements</p>
              <p className="text-xl font-bold text-foreground">{stats.count}</p>
            </div>
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-5 flex-1 flex flex-col justify-center pb-8"
        >
          <Link 
            to="/scanner"
            className="w-full bg-primary text-primary-foreground rounded-3xl p-8 shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-4 group border-b-4 border-primary-foreground/20"
          >
            <div className="w-20 h-20 rounded-full bg-background/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ScanLine className="w-10 h-10 text-primary-foreground" />
            </div>
            <div className="text-center">
              <span className="block text-3xl font-extrabold mb-1">SCANNER QR</span>
              <span className="block text-primary-foreground/80 font-medium">Identifier membre instantanément</span>
            </div>
          </Link>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <Link 
              to="/members-list"
              className="bg-secondary text-secondary-foreground rounded-2xl p-6 shadow-lg shadow-secondary/20 hover:brightness-110 active:scale-95 transition-all flex flex-col items-center text-center gap-3 border-b-4 border-background/20"
            >
              <Users className="w-8 h-8" />
              <span className="font-bold text-lg leading-tight">Saisie Manuelle</span>
            </Link>
            
            <Link 
              to="/payment-history"
              className="bg-card border border-border text-foreground rounded-2xl p-6 hover:bg-muted active:scale-95 transition-all flex flex-col items-center text-center gap-3 shadow-sm"
            >
               <History className="w-8 h-8 text-primary" />
              <span className="font-bold text-lg leading-tight">Historique</span>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AgentDashboard;
