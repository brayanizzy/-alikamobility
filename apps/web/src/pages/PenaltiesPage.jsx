import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import pb from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge.jsx';
import PenaltyCard from '@/components/finance/PenaltyCard.jsx';
import PaginationControls from '@/components/PaginationControls.jsx';
import { Ban, Loader2, AlertCircle, Search, Plus, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/utils/currency.js';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

const PenaltiesPage = () => {
  const { currentUser } = useAuth();
  const [penalties, setPenalties] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memberNames, setMemberNames] = useState({});
  const orgId = currentUser?.organization_id;

  const fetchPenalties = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const filterParts = [`organization_id = "${orgId}"`];
      if (statusFilter) filterParts.push(`status = "${statusFilter}"`);
      const res = await pb.collection('penalties').getList(page, perPage, {
        filter: filterParts.join(' && '), sort: '-created', $autoCancel: false,
      });
      const items = res.items || [];
      setPenalties(items);
      setTotalItems(res.totalItems || 0);

      const mIds = [...new Set(items.map(p => p.member_id).filter(Boolean))];
      if (mIds.length > 0) {
        const mRes = await pb.collection('members').getList(1, 50, {
          filter: mIds.map(id => `id = "${id}"`).join(' || '), fields: 'id,name', $autoCancel: false,
        }).catch(() => ({ items: [] }));
        const mMap = {}; (mRes.items || []).forEach(m => { mMap[m.id] = m; }); setMemberNames(mMap);
      }
    } catch (err) {
      console.error('Error fetching penalties:', err);
      setError('Impossible de charger les pénalités.');
    } finally { setLoading(false); }
  }, [orgId, page, perPage, statusFilter]);

  useEffect(() => { fetchPenalties(); }, [fetchPenalties]);

  const filteredPenalties = search
    ? penalties.filter(p => {
        const q = search.toLowerCase();
        const m = memberNames[p.member_id];
        return (m?.name || '').toLowerCase().includes(q) || (p.reason || '').toLowerCase().includes(q) || (p.penalty_type || '').toLowerCase().includes(q);
      })
    : penalties;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto">
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Pénalités</h1>
                <p className="text-muted-foreground">Gestion des pénalités et amendes.</p>
              </div>
              <Link to="/penalties/new"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" /> Ajouter Pénalité
              </Link>
            </motion.div>

            <motion.div variants={item} className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par membre, raison..."
                  className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="applied">Appliquée</option>
                <option value="paid">Payée</option>
                <option value="waived">Annulée</option>
              </select>
            </motion.div>

            {loading && <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

            {error && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p className="text-lg font-bold text-center">{error}</p>
                <button onClick={fetchPenalties} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Réessayer</button>
              </div>
            )}

            {!loading && !error && filteredPenalties.length === 0 && (
              <motion.div variants={item} className="text-center py-16">
                <Ban className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-xl font-bold text-foreground mb-2">Aucune pénalité</h3>
                <p className="text-muted-foreground mb-6">Aucune pénalité enregistrée pour cette organisation.</p>
                <Link to="/penalties/new"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all">
                  <Plus className="w-4 h-4" /> Ajouter une Pénalité
                </Link>
              </motion.div>
            )}

            {!loading && !error && filteredPenalties.length > 0 && (
              <>
                <motion.div variants={item} className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-card">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground text-sm uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold">Membre</th>
                        <th className="px-6 py-4 font-semibold hidden lg:table-cell">Type</th>
                        <th className="px-6 py-4 font-semibold">Raison</th>
                        <th className="px-6 py-4 font-semibold">Montant</th>
                        <th className="px-6 py-4 font-semibold">Statut</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredPenalties.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-6 py-4">
                            <Link to={`/penalties/${p.id}`} className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                                <Ban className="w-5 h-5 text-amber-500" />
                              </div>
                              <span className="font-bold text-foreground">{memberNames[p.member_id]?.name || 'N/A'}</span>
                            </Link>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell text-sm text-foreground">{p.penalty_type}</td>
                          <td className="px-6 py-4 text-sm text-foreground max-w-[200px] truncate">{p.reason}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-foreground">{formatCurrency(p.amount)}</td>
                          <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                          <td className="px-6 py-4 text-right">
                            <Link to={`/penalties/${p.id}`}
                              className="opacity-0 group-hover:opacity-100 inline-flex p-2 bg-card hover:bg-primary/20 text-muted-foreground hover:text-primary rounded-lg border border-transparent hover:border-primary/30 transition-all">
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>

                <motion.div variants={item} className="md:hidden space-y-3">
                  {filteredPenalties.map(p => (
                    <PenaltyCard key={p.id} penalty={p} memberName={memberNames[p.member_id]?.name} />
                  ))}
                </motion.div>

                <motion.div variants={item} className="mt-6">
                  <PaginationControls page={page} totalItems={totalItems} perPage={perPage} onPageChange={setPage} />
                </motion.div>
              </>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default PenaltiesPage;
