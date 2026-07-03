import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import pb from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge.jsx';
import DebtCard from '@/components/finance/DebtCard.jsx';
import PaginationControls from '@/components/PaginationControls.jsx';
import { Receipt, Loader2, AlertCircle, Search, Plus, ChevronRight, User, Truck } from 'lucide-react';
import { formatCurrency } from '@/utils/currency.js';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

const DebtsPage = () => {
  const { currentUser } = useAuth();
  const [debts, setDebts] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memberNames, setMemberNames] = useState({});
  const [vehicleInfo, setVehicleInfo] = useState({});
  const orgId = currentUser?.organization_id;

  const fetchDebts = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const filterParts = [`organization_id = "${orgId}"`];
      if (statusFilter) filterParts.push(`status = "${statusFilter}"`);
      if (typeFilter) filterParts.push(`debt_type = "${typeFilter}"`);
      const res = await pb.collection('debts').getList(page, perPage, {
        filter: filterParts.join(' && '), sort: '-created', $autoCancel: false,
      });
      const items = res.items || [];
      setDebts(items);
      setTotalItems(res.totalItems || 0);

      const mIds = [...new Set(items.map(d => d.member_id).filter(Boolean))];
      const vIds = [...new Set(items.map(d => d.vehicle_id).filter(Boolean))];

      const [mRes, vRes] = await Promise.all([
        mIds.length > 0 ? pb.collection('members').getList(1, 50, {
          filter: mIds.map(id => `id = "${id}"`).join(' || '), fields: 'id,name,phone', $autoCancel: false,
        }).catch(() => ({ items: [] })) : { items: [] },
        vIds.length > 0 ? pb.collection('vehicles').getList(1, 50, {
          filter: vIds.map(id => `id = "${id}"`).join(' || '), fields: 'id,plate,moto_number', $autoCancel: false,
        }).catch(() => ({ items: [] })) : { items: [] },
      ]);

      const mMap = {}; (mRes.items || []).forEach(m => { mMap[m.id] = m; }); setMemberNames(mMap);
      const vMap = {}; (vRes.items || []).forEach(v => { vMap[v.id] = v.plate || v.moto_number || 'N/A'; }); setVehicleInfo(vMap);
    } catch (err) {
      console.error('Error fetching debts:', err);
      setError('Impossible de charger les dettes.');
    } finally { setLoading(false); }
  }, [orgId, page, perPage, statusFilter, typeFilter]);

  useEffect(() => { fetchDebts(); }, [fetchDebts]);

  const filteredDebts = search
    ? debts.filter(d => {
        const q = search.toLowerCase();
        const m = memberNames[d.member_id];
        return (m?.name || '').toLowerCase().includes(q) || (m?.phone || '').toLowerCase().includes(q) || (vehicleInfo[d.vehicle_id] || '').toLowerCase().includes(q) || d.debt_type.toLowerCase().includes(q);
      })
    : debts;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto">
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Dettes</h1>
                <p className="text-muted-foreground">Gestion des dettes structurées.</p>
              </div>
              <Link to="/debts/new"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" /> Ajouter Dette
              </Link>
            </motion.div>

            <motion.div variants={item} className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par membre, téléphone, véhicule..."
                  className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
              </div>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
                <option value="">Tous les types</option>
                <option value="membership">Cotisation</option>
                <option value="penalty">Pénalité</option>
                <option value="loan">Prêt</option>
                <option value="other">Autre</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
                <option value="">Tous les statuts</option>
                <option value="active">Active</option>
                <option value="partially_paid">Partiellement payée</option>
                <option value="paid">Payée</option>
                <option value="written_off">Annulée</option>
              </select>
            </motion.div>

            {loading && <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

            {error && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p className="text-lg font-bold text-center">{error}</p>
                <button onClick={fetchDebts} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Réessayer</button>
              </div>
            )}

            {!loading && !error && filteredDebts.length === 0 && (
              <motion.div variants={item} className="text-center py-16">
                <Receipt className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-xl font-bold text-foreground mb-2">Aucune dette</h3>
                <p className="text-muted-foreground mb-6">Aucune dette enregistrée pour cette organisation.</p>
                <Link to="/debts/new"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all">
                  <Plus className="w-4 h-4" /> Ajouter une Dette
                </Link>
              </motion.div>
            )}

            {!loading && !error && filteredDebts.length > 0 && (
              <>
                <motion.div variants={item} className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-card">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground text-sm uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold">Membre</th>
                        <th className="px-6 py-4 font-semibold hidden lg:table-cell">Type</th>
                        <th className="px-6 py-4 font-semibold hidden lg:table-cell">Véhicule</th>
                        <th className="px-6 py-4 font-semibold">Montant</th>
                        <th className="px-6 py-4 font-semibold hidden lg:table-cell">Restant</th>
                        <th className="px-6 py-4 font-semibold">Statut</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredDebts.map((d) => (
                        <tr key={d.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-6 py-4">
                            <Link to={`/debts/${d.id}`} className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                                <Receipt className="w-5 h-5 text-red-500" />
                              </div>
                              <span className="font-bold text-foreground">{memberNames[d.member_id]?.name || 'N/A'}</span>
                            </Link>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell text-sm text-foreground">{d.debt_type}</td>
                          <td className="px-6 py-4 hidden lg:table-cell text-sm text-foreground">{vehicleInfo[d.vehicle_id] || '—'}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-foreground">{formatCurrency(d.amount_original)}</td>
                          <td className="px-6 py-4 hidden lg:table-cell text-sm font-semibold text-foreground">{formatCurrency(d.amount_remaining)}</td>
                          <td className="px-6 py-4"><StatusBadge status={d.status} /></td>
                          <td className="px-6 py-4 text-right">
                            <Link to={`/debts/${d.id}`}
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
                  {filteredDebts.map(d => (
                    <DebtCard key={d.id} debt={d} memberName={memberNames[d.member_id]?.name} />
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

export default DebtsPage;
