
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import { Building2, Users, CreditCard, Plus, Loader2 } from 'lucide-react';

const SuperAdminDashboard = () => {
  const [organizations, setOrganizations] = useState([]);
  const [stats, setStats] = useState({ totalOrgs: 0, totalMembers: 0, totalRevenue: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const [newOrgName, setNewOrgName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchDashboardData = async () => {
    try {
      const orgs = await pb.collection('organizations').getFullList({
        sort: '-created',
        $autoCancel: false
      });
      setOrganizations(orgs);
      
      const members = await pb.collection('members').getList(1, 1, { $autoCancel: false });
      const payments = await pb.collection('payments').getFullList({ $autoCancel: false });
      
      const totalRev = payments.reduce((acc, curr) => acc + curr.amount, 0);

      setStats({
        totalOrgs: orgs.length,
        totalMembers: members.totalItems,
        totalRevenue: totalRev
      });
    } catch (err) {
      console.error("Error fetching super admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Simulate realtime updates every 30s
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const org = await pb.collection('organizations').create({
        name: newOrgName,
        contact_email: adminEmail,
        subscription_plan: 'pro'
      }, { $autoCancel: false });

      const tempPassword = 'ChangeMe123!';
      await pb.collection('users').create({
        email: adminEmail,
        password: tempPassword,
        passwordConfirm: tempPassword,
        role: 'admin',
        organization_id: org.id,
        name: `${newOrgName} Admin`
      }, { $autoCancel: false });

      setFormSuccess(`Organisation créée! MDP Admin: ${tempPassword}`);
      setNewOrgName('');
      setAdminEmail('');
      
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && stats.totalOrgs === 0) {
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
        <aside className="w-64 border-r border-border bg-card/50 backdrop-blur z-10 hidden md:block">
          <div className="p-6">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-4">Super Admin</h2>
            <nav className="space-y-2">
              <a href="#" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg font-medium">
                <Building2 className="w-4 h-4" /> Organisations
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors">
                <Users className="w-4 h-4" /> Utilisateurs Globaux
              </a>
            </nav>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 z-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
            
            <header className="mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2">Aperçu Global</h1>
              <p className="text-muted-foreground">Surveillez et gérez toutes les organisations locataires.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <motion.div key={`o-${stats.totalOrgs}`} initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-muted-foreground">Total Organisations</h3>
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-foreground">{stats.totalOrgs}</p>
              </motion.div>
              
              <motion.div key={`m-${stats.totalMembers}`} initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-muted-foreground">Membres Globaux</h3>
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-secondary" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-foreground">{stats.totalMembers}</p>
              </motion.div>

              <motion.div key={`r-${stats.totalRevenue}`} initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-muted-foreground">Revenu Global</h3>
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-accent" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-foreground">
                  ${stats.totalRevenue.toLocaleString()}
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-8">
                  <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" /> Nouvelle Organisation
                  </h3>
                  
                  {formError && <p className="text-sm text-destructive mb-4 bg-destructive/10 p-3 rounded-lg">{formError}</p>}
                  {formSuccess && <p className="text-sm text-green-500 mb-4 bg-green-500/10 p-3 rounded-lg border border-green-500/20 font-mono">{formSuccess}</p>}

                  <form onSubmit={handleCreateOrg} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Nom Organisation</label>
                      <input 
                        type="text" 
                        required
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        placeholder="e.g. AITMC Kinshasa"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Email Admin</label>
                      <input 
                        type="email" 
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        placeholder="admin@org.com"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 hover:brightness-110 active:scale-95 transition-all flex justify-center items-center disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Provisionner Locataire'}
                    </button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-border flex justify-between items-center">
                    <h3 className="text-xl font-bold text-foreground">Locataires Actifs</h3>
                    <span className="text-sm px-3 py-1 bg-muted text-muted-foreground rounded-full font-medium">
                      {organizations.length} Total
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {organizations.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground">
                        Aucune organisation trouvée.
                      </div>
                    ) : (
                      organizations.map((org) => (
                        <div key={org.id} className="p-6 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h4 className="font-bold text-lg text-foreground mb-1">{org.name}</h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>ID: <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">{org.id}</code></span>
                              <span>•</span>
                              <span>Plan: <span className="text-secondary capitalize">{org.subscription_plan}</span></span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:items-end gap-1">
                            <span className="text-sm font-medium text-foreground">{org.contact_email}</span>
                            <span className="text-xs text-muted-foreground">Créé le {new Date(org.created).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
