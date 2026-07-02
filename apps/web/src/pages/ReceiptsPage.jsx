import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import PaginationControls from '@/components/PaginationControls.jsx';
import { FileText, Loader2, AlertCircle, Search, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/utils/currency.js';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

const ReceiptsPage = () => {
  const { currentUser } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memberNames, setMemberNames] = useState({});
  const orgId = currentUser?.organization_id;

  const fetchReceipts = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const filterParts = [`organization_id = "${orgId}"`];
      const res = await pb.collection('receipts').getList(page, perPage, {
        filter: filterParts.join(' && '), sort: '-created', $autoCancel: false,
      });
      const items = res.items || [];
      setReceipts(items);
      setTotalItems(res.totalItems || 0);

      const mIds = [...new Set(items.map(r => r.member_id).filter(Boolean))];
      if (mIds.length > 0) {
        const mRes = await pb.collection('members').getList(1, 50, {
          filter: mIds.map(id => `id = "${id}"`).join(' || '), fields: 'id,name', $autoCancel: false,
        }).catch(() => ({ items: [] }));
        const mMap = {}; (mRes.items || []).forEach(m => { mMap[m.id] = m; }); setMemberNames(mMap);
      }
    } catch (err) {
      console.error('Error fetching receipts:', err);
      setError('Impossible de charger les reçus.');
    } finally { setLoading(false); }
  }, [orgId, page, perPage]);

  useEffect(() => { fetchReceipts(); }, [fetchReceipts]);

  const filteredReceipts = search
    ? receipts.filter(r => {
        const q = search.toLowerCase();
        const m = memberNames[r.member_id];
        return (r.id || '').toLowerCase().includes(q) || (m?.name || '').toLowerCase().includes(q);
      })
    : receipts;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto">
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Reçus</h1>
                <p className="text-muted-foreground">Historique des reçus émis.</p>
              </div>
            </motion.div>

            <motion.div variants={item} className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par N° reçu, membre..."
                  className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
              </div>
            </motion.div>

            {loading && <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

            {error && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p className="text-lg font-bold text-center">{error}</p>
                <button onClick={fetchReceipts} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Réessayer</button>
              </div>
            )}

            {!loading && !error && filteredReceipts.length === 0 && (
              <motion.div variants={item} className="text-center py-16">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-xl font-bold text-foreground mb-2">Aucun reçu</h3>
                <p className="text-muted-foreground mb-6">Aucun reçu émis pour cette organisation.</p>
              </motion.div>
            )}

            {!loading && !error && filteredReceipts.length > 0 && (
              <>
                <motion.div variants={item} className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-card">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground text-sm uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold">N° Reçu</th>
                        <th className="px-6 py-4 font-semibold">Membre</th>
                        <th className="px-6 py-4 font-semibold">Montant</th>
                        <th className="px-6 py-4 font-semibold">Date</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredReceipts.map((r) => (
                        <tr key={r.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-6 py-4">
                            <Link to={`/receipts/${r.id}`} className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-emerald-500" />
                              </div>
                              <span className="font-bold text-foreground font-mono text-sm">#{r.id?.slice(-8)}</span>
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">{memberNames[r.member_id]?.name || '—'}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-foreground">{formatCurrency(r.amount || 0)}</td>
                          <td className="px-6 py-4 text-sm text-foreground">{r.created ? new Date(r.created).toLocaleDateString('fr-FR') : '—'}</td>
                          <td className="px-6 py-4 text-right">
                            <Link to={`/receipts/${r.id}`}
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
                  {filteredReceipts.map(r => (
                    <Link key={r.id} to={`/receipts/${r.id}`}
                      className="block bg-card border border-border rounded-2xl p-5 hover:bg-muted/30 transition-all shadow-card">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground font-mono text-sm">#{r.id?.slice(-8)}</p>
                          <p className="text-xs text-muted-foreground">{memberNames[r.member_id]?.name || '—'} · {formatCurrency(r.amount || 0)}</p>
                        </div>
                      </div>
                    </Link>
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

export default ReceiptsPage;
