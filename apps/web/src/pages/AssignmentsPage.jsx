import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import pb from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge.jsx';
import AssignmentCard from '@/components/transport/AssignmentCard.jsx';
import PaginationControls from '@/components/PaginationControls.jsx';
import { ClipboardCheck, Loader2, AlertCircle, Search, Plus, ChevronRight, User, Route as RouteIcon, MapPin } from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

const AssignmentsPage = () => {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicleNames, setVehicleNames] = useState({});
  const [driverNames, setDriverNames] = useState({});
  const [lineNames, setLineNames] = useState({});
  const [parkingNames, setParkingNames] = useState({});
  const orgId = currentUser?.organization_id;

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const filterParts = [`organization_id = "${orgId}"`];
      if (statusFilter) filterParts.push(`status = "${statusFilter}"`);
      const res = await pb.collection('vehicle_assignments').getList(page, perPage, {
        filter: filterParts.join(' && '), sort: '-created', $autoCancel: false,
      });
      const items = res.items || [];
      setAssignments(items);
      setTotalItems(res.totalItems || 0);

      const vIds = [...new Set(items.map(a => a.vehicle_id).filter(Boolean))];
      const dIds = [...new Set(items.map(a => a.driver_id).filter(Boolean))];
      const lIds = [...new Set(items.map(a => a.line_id).filter(Boolean))];
      const pIds = [...new Set(items.map(a => a.parking_id).filter(Boolean))];

      const [vRes, dRes, lRes, pRes] = await Promise.all([
        vIds.length > 0 ? pb.collection('vehicles').getList(1, 50, { filter: vIds.map(id => `id = "${id}"`).join(' || '), fields: 'id,plate,moto_number,brand,model', $autoCancel: false }).catch(() => ({ items: [] })) : { items: [] },
        dIds.length > 0 ? pb.collection('drivers').getList(1, 50, { filter: dIds.map(id => `id = "${id}"`).join(' || '), fields: 'id,member_id', $autoCancel: false }).catch(() => ({ items: [] })) : { items: [] },
        lIds.length > 0 ? pb.collection('lines').getList(1, 50, { filter: lIds.map(id => `id = "${id}"`).join(' || '), fields: 'id,name', $autoCancel: false }).catch(() => ({ items: [] })) : { items: [] },
        pIds.length > 0 ? pb.collection('parkings').getList(1, 50, { filter: pIds.map(id => `id = "${id}"`).join(' || '), fields: 'id,name', $autoCancel: false }).catch(() => ({ items: [] })) : { items: [] },
      ]);

      const vMap = {}; (vRes.items || []).forEach(v => { vMap[v.id] = `${v.plate || v.moto_number || 'N/A'} ${v.brand ? `(${v.brand})` : ''}`.trim(); });
      setVehicleNames(vMap);

      const dMembers = await Promise.all((dRes.items || []).map(async (d) => {
        if (d.member_id) {
          try {
            const m = await pb.collection('members').getOne(d.member_id, { fields: 'name', $autoCancel: false });
            return { id: d.id, name: m.name };
          } catch (e) { return { id: d.id, name: 'Chauffeur inconnu' }; }
        }
        return { id: d.id, name: 'Chauffeur inconnu' };
      }));
      const dMap = {}; dMembers.forEach(d => { dMap[d.id] = d.name; });
      setDriverNames(dMap);

      const lMap = {}; (lRes.items || []).forEach(l => { lMap[l.id] = l.name; });
      setLineNames(lMap);
      const pMap = {}; (pRes.items || []).forEach(p => { pMap[p.id] = p.name; });
      setParkingNames(pMap);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError('Impossible de charger les affectations.');
    } finally { setLoading(false); }
  }, [orgId, page, perPage, statusFilter]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const filteredAssignments = search
    ? assignments.filter(a => {
        const q = search.toLowerCase();
        return (vehicleNames[a.vehicle_id] || '').toLowerCase().includes(q)
          || (driverNames[a.driver_id] || '').toLowerCase().includes(q)
          || (lineNames[a.line_id] || '').toLowerCase().includes(q)
          || (parkingNames[a.parking_id] || '').toLowerCase().includes(q);
      })
    : assignments;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto">
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Affectations</h1>
                <p className="text-muted-foreground">Associer véhicules, chauffeurs, lignes et parkings.</p>
              </div>
              <Link to="/assignments/new"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" /> Nouvelle Affectation
              </Link>
            </motion.div>

            <motion.div variants={item} className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par véhicule, chauffeur..."
                  className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
                <option value="">Tous les statuts</option>
                <option value="active">Active</option>
                <option value="ended">Terminée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </motion.div>

            {loading && <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

            {error && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p className="text-lg font-bold text-center">{error}</p>
                <button onClick={fetchAssignments} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Réessayer</button>
              </div>
            )}

            {!loading && !error && filteredAssignments.length === 0 && (
              <motion.div variants={item} className="text-center py-16">
                <ClipboardCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-xl font-bold text-foreground mb-2">Aucune affectation</h3>
                <p className="text-muted-foreground mb-6">Créez votre première affectation pour associer un véhicule, chauffeur et ligne.</p>
                <Link to="/assignments/new"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all">
                  <Plus className="w-4 h-4" /> Nouvelle Affectation
                </Link>
              </motion.div>
            )}

            {!loading && !error && filteredAssignments.length > 0 && (
              <>
                <motion.div variants={item} className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-card">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground text-sm uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold">Véhicule</th>
                        <th className="px-6 py-4 font-semibold hidden lg:table-cell">Chauffeur</th>
                        <th className="px-6 py-4 font-semibold hidden lg:table-cell">Ligne</th>
                        <th className="px-6 py-4 font-semibold hidden lg:table-cell">Parking</th>
                        <th className="px-6 py-4 font-semibold">Statut</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredAssignments.map((a) => (
                        <tr key={a.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-6 py-4">
                            <Link to={`/assignments/${a.id}`} className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                                <ClipboardCheck className="w-5 h-5 text-indigo-500" />
                              </div>
                              <span className="font-bold text-foreground">{vehicleNames[a.vehicle_id] || 'N/A'}</span>
                            </Link>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell text-sm text-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" /> {driverNames[a.driver_id] || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell text-sm text-foreground">
                            <span className="flex items-center gap-1">
                              <RouteIcon className="w-3 h-3" /> {lineNames[a.line_id] || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell text-sm text-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {parkingNames[a.parking_id] || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4"><StatusBadge status={a.status} /></td>
                          <td className="px-6 py-4 text-right">
                            <Link to={`/assignments/${a.id}`}
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
                  {filteredAssignments.map(a => (
                    <AssignmentCard key={a.id} assignment={a}
                      vehicleName={vehicleNames[a.vehicle_id]}
                      driverName={driverNames[a.driver_id]}
                      lineName={lineNames[a.line_id]}
                      parkingName={parkingNames[a.parking_id]} />
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

export default AssignmentsPage;
