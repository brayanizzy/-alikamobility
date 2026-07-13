import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import pb from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge.jsx';
import PaginationControls from '@/components/PaginationControls.jsx';
import PersonRoleBadge from '@/components/people/PersonRoleBadge.jsx';
import {
  UserCircle, Loader2, AlertCircle, Search, Plus, Filter, ChevronRight,
  Calendar, Phone, CreditCard
} from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

const DriversPage = () => {
  const { currentUser } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [members, setMembers] = useState({});
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const orgId = currentUser?.organization_id;

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!orgId) {
        setDrivers([]);
        setMembers({});
        setTotalItems(0);
        return;
      }

      const filterParts = [`organization_id = "${orgId}"`];
      if (statusFilter) filterParts.push(`status = "${statusFilter}"`);

      const driverFilter = filterParts.join(' && ');
      const res = await pb.collection('drivers').getList(page, perPage, {
        filter: driverFilter,
        sort: '-created',
        $autoCancel: false,
      });

      const items = res.items || [];
      setDrivers(items);
      setTotalItems(res.totalItems || 0);

      const memberIds = [...new Set(items.map(d => d.member_id).filter(Boolean))];
      if (memberIds.length > 0) {
        const memberFilter = memberIds.map(id => `id = "${id}"`).join(' || ');
        const membersRes = await pb.collection('members').getList(1, 50, {
          filter: memberFilter,
          $autoCancel: false,
        });
        const memberMap = {};
        (membersRes.items || []).forEach(m => { memberMap[m.id] = m; });
        setMembers(memberMap);
      } else {
        setMembers({});
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Impossible de charger les chauffeurs.');
    } finally {
      setLoading(false);
    }
  }, [orgId, page, perPage, statusFilter]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const filteredDrivers = search
    ? drivers.filter(d => {
        const m = members[d.member_id];
        const name = m?.name || '';
        const phone = m?.phone || '';
        const license = d.license_number || '';
        const q = search.toLowerCase();
        return name.toLowerCase().includes(q) || phone.includes(q) || license.toLowerCase().includes(q);
      })
    : drivers;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto">
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Chauffeurs</h1>
                <p className="text-muted-foreground">Gestion des chauffeurs de l'organisation.</p>
              </div>
              <Link to="/drivers/new"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" /> Ajouter Chauffeur
              </Link>
            </motion.div>

            {/* Filters */}
            <motion.div variants={item} className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par nom, téléphone ou permis..."
                  className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
              </div>
              <div className="flex gap-2">
                {['', 'active', 'suspended', 'expired', 'inactive'].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      statusFilter === s
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                    }`}>
                    {s ? (s.charAt(0).toUpperCase() + s.slice(1)) : 'Tous'}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Loading State */}
            {loading && (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p className="text-lg font-bold text-center">{error}</p>
                <button onClick={fetchDrivers}
                  className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">
                  Réessayer
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredDrivers.length === 0 && (
              <motion.div variants={item} className="text-center py-16">
                <UserCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-xl font-bold text-foreground mb-2">Aucun chauffeur</h3>
                <p className="text-muted-foreground mb-6">Commencez par ajouter un chauffeur à votre organisation.</p>
                <Link to="/drivers/new"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all">
                  <Plus className="w-4 h-4" /> Ajouter un Chauffeur
                </Link>
              </motion.div>
            )}

            {/* Drivers List */}
            {!loading && !error && filteredDrivers.length > 0 && (
              <>
                <motion.div variants={item} className="space-y-3">
                  {filteredDrivers.map((driver) => {
                    const member = members[driver.member_id];
                    const isExpiring = driver.license_expiry && new Date(driver.license_expiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && new Date(driver.license_expiry) > new Date();
                    const isExpired = driver.license_expiry && new Date(driver.license_expiry) < new Date();
                    return (
                      <Link key={driver.id} to={`/drivers/${driver.id}`}
                        className="block bg-card border border-border rounded-2xl p-5 hover:bg-muted/30 transition-all shadow-card group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                            <UserCircle className="w-6 h-6 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-foreground truncate">{member?.name || 'Membre inconnu'}</span>
                              <StatusBadge status={driver.status} />
                              <PersonRoleBadge role="driver" />
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              {member?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{member.phone}</span>}
                              {driver.license_number && <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" />Permis: {driver.license_number}</span>}
                              {driver.license_expiry && (
                                <span className={`flex items-center gap-1 ${isExpired ? 'text-red-500' : isExpiring ? 'text-amber-500' : ''}`}>
                                  <Calendar className="w-3 h-3" />
                                  Exp: {new Date(driver.license_expiry).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    );
                  })}
                </motion.div>

                {/* Pagination */}
                <motion.div variants={item} className="mt-6">
                  <PaginationControls
                    page={page}
                    totalItems={totalItems}
                    perPage={perPage}
                    onPageChange={setPage}
                  />
                </motion.div>
              </>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DriversPage;
