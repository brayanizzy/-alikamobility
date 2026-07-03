import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import pb from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge.jsx';
import VehicleCard from '@/components/transport/VehicleCard.jsx';
import VehicleTypeBadge from '@/components/transport/VehicleTypeBadge.jsx';
import PaginationControls from '@/components/PaginationControls.jsx';
import {
  Truck, Loader2, AlertCircle, Search, Plus, Filter, ChevronRight,
  Car, User, MapPin, FileText
} from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

const VehiclesPage = () => {
  const { currentUser } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicleTypes, setVehicleTypes] = useState({});
  const [parkings, setParkings] = useState({});
  const [memberNames, setMemberNames] = useState({});
  const orgId = currentUser?.organization_id;

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filterParts = [`organization_id = "${orgId}"`];
      if (typeFilter) filterParts.push(`vehicle_type_id = "${typeFilter}"`);
      if (statusFilter) filterParts.push(`status = "${statusFilter}"`);

      const [vehiclesRes, typesRes, parkingsRes] = await Promise.all([
        pb.collection('vehicles').getList(page, perPage, {
          filter: filterParts.join(' && '),
          sort: '-created',
          $autoCancel: false,
        }),
        pb.collection('vehicle_types').getList(1, 50, { sort: 'name', $autoCancel: false }).catch(() => ({ items: [] })),
        pb.collection('parkings').getFullList({ filter: `organization_id = "${orgId}"`, $autoCancel: false }).catch(() => []),
      ]);

      const items = vehiclesRes.items || [];
      setVehicles(items);
      setTotalItems(vehiclesRes.totalItems || 0);

      const tMap = {}; (typesRes.items || []).forEach(t => { tMap[t.id] = t; });
      setVehicleTypes(tMap);

      const pMap = {}; (parkingsRes || []).forEach(p => { pMap[p.id] = p.name; });
      setParkings(pMap);

      const memberIds = [...new Set(items.map(v => v.member_id).filter(Boolean))];
      if (memberIds.length > 0) {
        const mFilter = memberIds.map(id => `id = "${id}"`).join(' || ');
        const mRes = await pb.collection('members').getList(1, 50, {
          filter: mFilter, fields: 'id,name,phone', $autoCancel: false,
        }).catch(() => ({ items: [] }));
        const mMap = {}; (mRes.items || []).forEach(m => { mMap[m.id] = m; });
        setMemberNames(mMap);
      } else {
        setMemberNames({});
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError('Impossible de charger les véhicules.');
    } finally {
      setLoading(false);
    }
  }, [orgId, page, perPage, typeFilter, statusFilter]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const filteredVehicles = search
    ? vehicles.filter(v => {
        const q = search.toLowerCase();
        const member = memberNames[v.member_id];
        const type = vehicleTypes[v.vehicle_type_id];
        return (v.plate || '').toLowerCase().includes(q)
          || (v.moto_number || '').toLowerCase().includes(q)
          || (v.brand || '').toLowerCase().includes(q)
          || (v.model || '').toLowerCase().includes(q)
          || (v.color || '').toLowerCase().includes(q)
          || (member?.name || '').toLowerCase().includes(q)
          || (type?.name || '').toLowerCase().includes(q);
      })
    : vehicles;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto">
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Véhicules</h1>
                <p className="text-muted-foreground">Gestion des véhicules de l'organisation.</p>
              </div>
              <Link to="/vehicles/new"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" /> Ajouter Véhicule
              </Link>
            </motion.div>

            <motion.div variants={item} className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par plaque, marque, modèle..."
                  className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
              </div>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
                <option value="">Tous les types</option>
                {Object.values(vehicleTypes).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
                <option value="">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="suspended">Suspendu</option>
                <option value="out_of_service">En panne</option>
                <option value="retired">Retiré</option>
                <option value="sold">Vendu</option>
                <option value="pending">En attente</option>
              </select>
            </motion.div>

            {loading && (
              <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p className="text-lg font-bold text-center">{error}</p>
                <button onClick={fetchVehicles}
                  className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Réessayer</button>
              </div>
            )}

            {!loading && !error && filteredVehicles.length === 0 && (
              <motion.div variants={item} className="text-center py-16">
                <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-xl font-bold text-foreground mb-2">Aucun véhicule</h3>
                <p className="text-muted-foreground mb-6">Commencez par ajouter un véhicule à votre organisation.</p>
                <Link to="/vehicles/new"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all">
                  <Plus className="w-4 h-4" /> Ajouter un Véhicule
                </Link>
              </motion.div>
            )}

            {!loading && !error && filteredVehicles.length > 0 && (
              <>
                <motion.div variants={item} className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-card">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground text-sm uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold">Véhicule</th>
                        <th className="px-6 py-4 font-semibold">Type</th>
                        <th className="px-6 py-4 font-semibold hidden lg:table-cell">Propriétaire</th>
                        <th className="px-6 py-4 font-semibold hidden lg:table-cell">Parking</th>
                        <th className="px-6 py-4 font-semibold">Statut</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredVehicles.map((v) => {
                        const member = memberNames[v.member_id];
                        const type = vehicleTypes[v.vehicle_type_id];
                        return (
                          <tr key={v.id} className="hover:bg-muted/30 transition-colors group">
                            <td className="px-6 py-4">
                              <Link to={`/vehicles/${v.id}`} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                                  <Truck className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                  <p className="font-bold text-foreground">{v.plate || v.moto_number || 'N/A'}</p>
                                  <p className="text-xs text-muted-foreground">{v.brand} {v.model}</p>
                                </div>
                              </Link>
                            </td>
                            <td className="px-6 py-4">{type && <VehicleTypeBadge type={type.name} />}</td>
                            <td className="px-6 py-4 hidden lg:table-cell text-sm text-foreground">{member?.name || '—'}</td>
                            <td className="px-6 py-4 hidden lg:table-cell text-sm text-foreground">{parkings[v.parking_id] || '—'}</td>
                            <td className="px-6 py-4"><StatusBadge status={v.status} /></td>
                            <td className="px-6 py-4 text-right">
                              <Link to={`/vehicles/${v.id}`}
                                className="opacity-0 group-hover:opacity-100 inline-flex p-2 bg-card hover:bg-primary/20 text-muted-foreground hover:text-primary rounded-lg border border-transparent hover:border-primary/30 transition-all">
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </motion.div>

                <motion.div variants={item} className="md:hidden space-y-3">
                  {filteredVehicles.map(v => {
                    const member = memberNames[v.member_id];
                    const type = vehicleTypes[v.vehicle_type_id];
                    return (
                      <VehicleCard key={v.id} vehicle={v}
                        ownerName={member?.name}
                        parkingName={parkings[v.parking_id]}
                        typeName={type?.name} />
                    );
                  })}
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

export default VehiclesPage;
