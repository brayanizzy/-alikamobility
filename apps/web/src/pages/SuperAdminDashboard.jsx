import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import pb from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import StatCard from '@/components/dashboard/StatCard.jsx';
import QuickActionCard from '@/components/dashboard/QuickActionCard.jsx';
import RecentActivityList from '@/components/dashboard/RecentActivityList.jsx';
import AlertPanel from '@/components/dashboard/AlertPanel.jsx';
import DashboardSection, { itemVariants } from '@/components/dashboard/DashboardSection.jsx';
import {
  Building2, Users, CreditCard, Plus, Loader2, ShieldCheck, AlertCircle,
  MapPin, Phone, Calendar, Trash2, ChevronDown, Percent, TrendingUp,
  CheckCircle2, XCircle, Clock, Mail, Globe, Activity, DollarSign, BarChart3,
  UserPlus, Settings, Bell, Car
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currency.js';

const PLANS = ['free', 'starter', 'pro', 'enterprise'];
const PLAN_LABELS = { free: 'Gratuit', starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' };

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-2xl bg-card border border-border overflow-hidden ${className}`}>
      <div className="animate-shimmer h-full w-full min-h-[100px]" />
    </div>
  );
}

const SuperAdminDashboard = () => {
  const [organizations, setOrganizations] = useState([]);
  const [stats, setStats] = useState({
    totalOrgs: 0, totalMembers: 0, totalRevenue: 0, totalAgents: 0,
    activeOrgs: 0, paymentsToday: 0, recoveryRate: 0,
    pendingOrgs: 0, suspendedOrgs: 0, totalUsers: 0, totalAdmins: 0
  });
  const [recentOrgs, setRecentOrgs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrg, setExpandedOrg] = useState(null);

  const [newOrgName, setNewOrgName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const writeAuditLog = async (action, targetId, details = {}) => {
    try {
      await pb.collection('admin_audit_logs').create({
        action, target_collection: 'organizations', target_id: targetId,
        details: JSON.stringify(details),
      }, { $autoCancel: false });
    } catch (_) { /* silent */ }
  };

  const fetchDashboardData = async () => {
    try {
      const [orgsRes, membersCount, agentsCount, usersCount, notificationsRes] = await Promise.all([
        pb.collection('organizations').getList(1, 500, { sort: '-created', $autoCancel: false }),
        pb.collection('members').getList(1, 1, { $autoCancel: false }),
        pb.collection('users').getList(1, 1, { filter: 'role = "agent"', $autoCancel: false }),
        pb.collection('users').getList(1, 1, { $autoCancel: false }),
        pb.collection('notifications').getList(1, 5, {
          filter: 'type = "alert"',
          sort: '-created',
          $autoCancel: false
        }),
      ]);

      const orgs = orgsRes.items || [];

      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      const payments = await pb.collection('payments').getList(1, 500, {
        filter: `payment_date >= "${monthStartStr}"`,
        sort: '-created',
        $autoCancel: false,
      });
      const paymentItems = payments.items || [];
      const totalRev = paymentItems.reduce((acc, curr) => acc + curr.amount, 0);
      const todayPayments = paymentItems.filter(p => p.payment_date === today);

      const activeOrgs = orgs.filter(o => o.status === 'active').length;
      const pendingOrgs = orgs.filter(o => o.status === 'pending').length;
      const suspendedOrgs = orgs.filter(o => o.status === 'suspended').length;
      const adminCount = (usersCount.totalItems || 0) - (agentsCount.totalItems || 0);

      const uniquePaidToday = new Set(todayPayments.map(p => p.member_id)).size;
      const recoveryRate = membersCount.totalItems > 0
        ? ((uniquePaidToday / membersCount.totalItems) * 100).toFixed(1)
        : 0;

      setStats({
        totalOrgs: orgs.length,
        activeOrgs,
        pendingOrgs,
        suspendedOrgs,
        totalMembers: membersCount.totalItems,
        totalAgents: agentsCount.totalItems,
        totalUsers: usersCount.totalItems,
        totalAdmins: Math.max(0, adminCount - 1),
        totalRevenue: totalRev,
        paymentsToday: todayPayments.length,
        recoveryRate: parseFloat(recoveryRate),
      });

      setRecentOrgs(orgs.slice(0, 5).map(o => ({
        id: o.id,
        title: o.name,
        name: o.name,
        created: o.created,
        status: o.status,
        amount: undefined,
      })));

      const pendingAlerts = [];
      if (pendingOrgs > 0) {
        pendingAlerts.push({
          id: 'pending-orgs',
          severity: 'warning',
          title: `${pendingOrgs} organisation${pendingOrgs > 1 ? 's' : ''} en attente`,
          message: 'Ces organisations nécessitent votre approbation',
          link: '#',
        });
      }
      if (suspendedOrgs > 0) {
        pendingAlerts.push({
          id: 'suspended-orgs',
          severity: 'error',
          title: `${suspendedOrgs} organisation${suspendedOrgs > 1 ? 's' : ''} suspendue${suspendedOrgs > 1 ? 's' : ''}`,
          message: 'Ces organisations ont été suspendues',
          link: '#',
        });
      }
      setAlerts(pendingAlerts);
    } catch (err) {
      console.error("Error fetching super admin data:", err);
      setError("Impossible de charger les données. Vérifiez votre connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const org = await pb.collection('organizations').create({
        name: newOrgName, contact_email: adminEmail, subscription_plan: 'pro', status: 'active',
      }, { $autoCancel: false });

      const tempPassword = 'ChangeMe123!';
      await pb.collection('users').create({
        email: adminEmail, password: tempPassword, passwordConfirm: tempPassword,
        role: 'admin', organization_id: org.id, name: `${newOrgName} Admin`,
      }, { $autoCancel: false });

      toast.success(`Organisation créée! Email: ${adminEmail} / MDP: ${tempPassword}`);
      setNewOrgName(''); setAdminEmail('');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (org, newStatus) => {
    try {
      await pb.collection('organizations').update(org.id, { status: newStatus }, { $autoCancel: false });
      await writeAuditLog(`organization.${newStatus}`, org.id, { name: org.name });
      toast.success(`${org.name} ${newStatus === 'active' ? 'activée' : newStatus === 'suspended' ? 'suspendue' : 'approuvée'}`);
      fetchDashboardData();
    } catch (err) {
      toast.error("Erreur de changement de statut");
    }
  };

  const handlePlanChange = async (org, plan) => {
    try {
      await pb.collection('organizations').update(org.id, { subscription_plan: plan }, { $autoCancel: false });
      await writeAuditLog('organization.plan_changed', org.id, { name: org.name, plan });
      toast.success(`${org.name} → Plan ${PLAN_LABELS[plan]}`);
      fetchDashboardData();
    } catch (err) {
      toast.error("Erreur de changement de plan");
    }
  };

  const handleDeleteOrg = async (org) => {
    if (!window.confirm(`Supprimer définitivement ${org.name} ? Cette action est irréversible.`)) return;
    try {
      await pb.collection('organizations').delete(org.id, { $autoCancel: false });
      await writeAuditLog('organization.deleted', org.id, { name: org.name });
      toast.success(`${org.name} supprimée`);
      fetchDashboardData();
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (isLoading && stats.totalOrgs === 0) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <Header />
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-4">
          <SkeletonCard className="h-16" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => <SkeletonCard key={i} className="h-32" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <Header />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-4 px-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-bold text-center">{error}</p>
          <button onClick={() => { setError(null); setIsLoading(true); fetchDashboardData(); }}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      <Header />

      <div className="flex-1 flex overflow-hidden relative">
        <aside className="w-64 border-r border-border bg-card/30 backdrop-blur z-10 hidden md:block">
          <div className="p-6">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-4">Super Admin</h2>
            <nav className="space-y-2">
              <a href="#" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg font-medium">
                <Building2 className="w-4 h-4" /> Organisations
              </a>
            </nav>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 z-10">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-7xl mx-auto"
          >
            <motion.div variants={item} className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2">Super Admin</h1>
              <p className="text-muted-foreground">Vision SaaS globale — surveillez et gérez toutes les organisations.</p>
            </motion.div>

            {/* KPI Grid */}
            <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Building2} label="Organisations" value={stats.totalOrgs} sub="toutes confondues" color="primary" />
              <StatCard icon={CheckCircle2} label="Actives" value={stats.activeOrgs} sub={`${stats.totalOrgs > 0 ? Math.round((stats.activeOrgs/stats.totalOrgs)*100) : 0}% du total`} color="success" />
              <StatCard icon={Clock} label="En attente" value={stats.pendingOrgs} sub="à approuver" color="warning" />
              <StatCard icon={XCircle} label="Suspendues" value={stats.suspendedOrgs} sub="nécessitent attention" color="danger" />
              <StatCard icon={Users} label="Utilisateurs" value={stats.totalUsers} sub={`${stats.totalAdmins} admins, ${stats.totalAgents} agents`} color="accent" />
              <StatCard icon={ShieldCheck} label="Membres" value={stats.totalMembers} sub="toutes organisations" color="secondary" />
              <StatCard icon={DollarSign} label="Revenu Mensuel" value={formatCurrency(stats.totalRevenue)} sub={`${stats.paymentsToday} paiements aujourd'hui`} color="primary" />
              <StatCard icon={BarChart3} label="Recouvrement" value={`${stats.recoveryRate}%`} sub="moyen global" color="secondary" />
            </motion.div>

            {/* Two column: Alert Panel + Quick Actions */}
            <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <AlertPanel
                  title="Alertes Système"
                  alerts={alerts}
                  viewAllLink="/notifications"
                />
              </div>
              <div>
                <div className="bg-card border border-border rounded-2xl p-6 shadow-card h-full">
                  <h3 className="text-lg font-bold text-foreground mb-4">Actions Rapides</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <QuickActionCard icon={Plus} title="Créer Organisation" color="primary" href="#new-org" />
                    <QuickActionCard icon={Building2} title="Voir Organisations" color="secondary" href="#" />
                    <QuickActionCard icon={Users} title="Utilisateurs" color="blue" comingSoon />
                    <QuickActionCard icon={Car} title="Types Véhicules" color="purple" comingSoon />
                    <QuickActionCard icon={Bell} title="Notifications" color="emerald" href="/notifications" />
                    <QuickActionCard icon={Settings} title="Paramètres" color="amber" comingSoon />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recent Organizations */}
            <motion.div variants={item} className="mb-8">
              <RecentActivityList
                items={recentOrgs}
                type="member"
                title="Organisations Récentes"
                viewAllLink="#"
                maxItems={5}
              />
            </motion.div>

            {/* Create Org + Orgs List */}
            <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Create Org Form */}
              <div className="lg:col-span-1">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-card sticky top-8">
                  <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" /> Nouvelle Organisation
                  </h3>

                  <form onSubmit={handleCreateOrg} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Nom</label>
                      <input type="text" required value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        placeholder="Ex: AITMC Kinshasa" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Email Admin</label>
                      <input type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        placeholder="admin@org.com" />
                    </div>
                    <button type="submit" disabled={isSubmitting}
                      className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 hover:brightness-110 active:scale-95 transition-all flex justify-center items-center disabled:opacity-50 disabled:pointer-events-none">
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Créer'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Organizations List */}
              <div className="lg:col-span-2">
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
                  <div className="p-6 border-b border-border flex justify-between items-center">
                    <h3 className="text-xl font-bold text-foreground">Toutes les Organisations</h3>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-500 rounded-full font-bold">{stats.activeOrgs} actives</span>
                      <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full font-medium">{organizations.length} total</span>
                    </div>
                  </div>
                  <div className="divide-y divide-border">
                    {organizations.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground">
                        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">Aucune organisation trouvée.</p>
                      </div>
                    ) : (
                      organizations.map((org) => (
                        <OrgRow
                          key={org.id}
                          org={org}
                          isExpanded={expandedOrg === org.id}
                          onToggle={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)}
                          onStatusChange={handleStatusChange}
                          onPlanChange={handlePlanChange}
                          onDelete={handleDeleteOrg}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

const COLORS = {
  primary: { bg: 'bg-primary/15', icon: 'text-primary', gradient: 'from-primary/10 to-primary/5' },
  secondary: { bg: 'bg-secondary/15', icon: 'text-secondary', gradient: 'from-secondary/10 to-secondary/5' },
  accent: { bg: 'bg-accent/30', icon: 'text-accent-foreground', gradient: 'from-accent/30 to-accent/10' },
};

const OrgRow = ({ org, isExpanded, onToggle, onStatusChange, onPlanChange, onDelete }) => {
  const statusColor = org.status === 'active' ? 'bg-green-500/20 text-green-500'
    : org.status === 'pending' ? 'bg-amber-500/20 text-amber-500'
    : 'bg-destructive/20 text-destructive';

  const statusIcon = org.status === 'active' ? CheckCircle2
    : org.status === 'pending' ? Clock
    : XCircle;
  const StatusIcon = statusIcon;

  return (
    <div className="transition-colors">
      <button onClick={onToggle}
        className="w-full p-5 hover:bg-muted/30 transition-colors flex items-center justify-between gap-4 text-left">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <StatusIcon className={`w-4 h-4 ${statusColor.split(' ')[0]}`} />
            <h4 className="font-bold text-foreground truncate">{org.name}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${statusColor}`}>
              {org.status?.toUpperCase() || 'ACTIF'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{org.contact_email || '—'}</span>
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{org.contact_phone || '—'}</span>
            <span>Plan: <span className="text-secondary capitalize font-bold">{PLAN_LABELS[org.subscription_plan] || org.subscription_plan}</span></span>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
          className="px-5 pb-5 border-t border-border pt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">ID</p>
              <code className="text-xs bg-muted px-2 py-1 rounded text-foreground">{org.id}</code>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Ville</p>
              <p className="text-sm font-medium text-foreground">{org.city || 'Non renseignée'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Créée le</p>
              <p className="text-sm font-medium text-foreground">{new Date(org.created).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Manager</p>
              <p className="text-sm font-medium text-foreground">{org.manager_name || 'Non renseigné'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Téléphone</p>
              <p className="text-sm font-medium text-foreground">{org.contact_phone || 'Non renseigné'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Plan</p>
              <p className="text-sm font-bold text-secondary capitalize">{PLAN_LABELS[org.subscription_plan] || org.subscription_plan}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {org.status === 'pending' && (
              <ActionBtn onClick={() => onStatusChange(org, 'active')} color="green" icon={ShieldCheck}>
                Approuver
              </ActionBtn>
            )}
            {org.status === 'active' && (
              <ActionBtn onClick={() => onStatusChange(org, 'suspended')} color="red" icon={XCircle}>
                Suspendre
              </ActionBtn>
            )}
            {org.status === 'suspended' && (
              <ActionBtn onClick={() => onStatusChange(org, 'active')} color="green" icon={CheckCircle2}>
                Réactiver
              </ActionBtn>
            )}

            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors">
                <CreditCard className="w-3 h-3" /> Changer Plan <ChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-modal z-20 hidden group-hover:block min-w-[140px] overflow-hidden">
                {PLANS.map(p => (
                  <button key={p} onClick={() => onPlanChange(org, p)}
                    className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-muted transition-colors flex items-center gap-2 ${org.subscription_plan === p ? 'text-primary bg-primary/5' : 'text-foreground'}`}>
                    {org.subscription_plan === p && <CheckCircle2 className="w-3 h-3 text-primary" />}
                    {PLAN_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            <ActionBtn onClick={() => onDelete(org)} color="red" icon={Trash2}>
              Supprimer
            </ActionBtn>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const ActionBtn = ({ onClick, color, icon: Icon, children }) => {
  const btnColors = {
    green: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
    red: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
  };
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors active:scale-95 ${btnColors[color] || btnColors.green}`}>
      <Icon className="w-3 h-3" /> {children}
    </button>
  );
};

export default SuperAdminDashboard;
