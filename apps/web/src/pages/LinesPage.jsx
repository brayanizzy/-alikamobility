import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge.jsx';
import LineCard from '@/components/transport/LineCard.jsx';
import PaginationControls from '@/components/PaginationControls.jsx';
import { Route, Loader2, AlertCircle, Search, Plus, ChevronRight } from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

const LinesPage = () => {
  const { currentUser } = useAuth();
  const [lines, setLines] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const orgId = currentUser?.organization_id;

  const fetchLines = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const filterParts = [`organization_id = "${orgId}"`];
      if (statusFilter) filterParts.push(`status = "${statusFilter}"`);
      const res = await pb.collection('lines').getList(page, perPage, {
        filter: filterParts.join(' && '), sort: '-created', $autoCancel: false,
      });
      setLines(res.items || []);
      setTotalItems(res.totalItems || 0);
    } catch (err) {
      console.error('Error fetching lines:', err);
      setError('Impossible de charger les lignes.');
    } finally { setLoading(false); }
  }, [orgId, page, perPage, statusFilter]);

  useEffect(() => { fetchLines(); }, [fetchLines]);

  const filteredLines = search
    ? lines.filter(l => {
        const q = search.toLowerCase();
        return (l.name || '').toLowerCase().includes(q)
          || (l.departure || '').toLowerCase().includes(q)
          || (l.arrival || '').toLowerCase().includes(q);
      })
    : lines;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto">
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Lignes</h1>
                <p className="text-muted-foreground">Gestion des lignes de transport.</p>
              </div>
              <Link to="/lines/new"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" /> Ajouter une Ligne
              </Link>
            </motion.div>

            <motion.div variants={item} className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par nom, départ, arrivée..."
                  className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
                <option value="">Tous les statuts</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspendue</option>
              </select>
            </motion.div>

            {loading && <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

            {error && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p className="text-lg font-bold text-center">{error}</p>
                <button onClick={fetchLines} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Réessayer</button>
              </div>
            )}

            {!loading && !error && filteredLines.length === 0 && (
              <motion.div variants={item} className="text-center py-16">
                <Route className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-xl font-bold text-foreground mb-2">Aucune ligne</h3>
                <p className="text-muted-foreground mb-6">Commencez par ajouter une ligne de transport.</p>
                <Link to="/lines/new"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all">
                  <Plus className="w-4 h-4" /> Ajouter une Ligne
                </Link>
              </motion.div>
            )}

            {!loading && !error && filteredLines.length > 0 && (
              <>
                <motion.div variants={item} className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-card">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground text-sm uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold">Nom</th>
                        <th className="px-6 py-4 font-semibold">Trajet</th>
                        <th className="px-6 py-4 font-semibold hidden lg:table-cell">Distance</th>
                        <th className="px-6 py-4 font-semibold hidden lg:table-cell">Tarif Base</th>
                        <th className="px-6 py-4 font-semibold">Statut</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredLines.map((l) => (
                        <tr key={l.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-6 py-4">
                            <Link to={`/lines/${l.id}`} className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                                <Route className="w-5 h-5 text-amber-500" />
                              </div>
                              <span className="font-bold text-foreground">{l.name}</span>
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">{l.departure && l.arrival ? `${l.departure} → ${l.arrival}` : '—'}</td>
                          <td className="px-6 py-4 hidden lg:table-cell text-sm text-foreground">{l.distance_km ? `${l.distance_km} km` : '—'}</td>
                          <td className="px-6 py-4 hidden lg:table-cell text-sm text-foreground">{l.base_fare ? `${Number(l.base_fare).toLocaleString()} FC` : '—'}</td>
                          <td className="px-6 py-4"><StatusBadge status={l.status} /></td>
                          <td className="px-6 py-4 text-right">
                            <Link to={`/lines/${l.id}`}
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
                  {filteredLines.map(l => <LineCard key={l.id} line={l} />)}
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

export default LinesPage;
