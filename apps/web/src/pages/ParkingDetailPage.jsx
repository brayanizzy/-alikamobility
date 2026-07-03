import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import { formatCurrency } from '@/utils/currency.js';
import {
  MapPin, Loader2, AlertCircle, ArrowLeft, Edit, ClipboardCheck,
  User, Phone, DollarSign, Target, Calendar
} from 'lucide-react';

const ParkingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parking, setParking] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicleNames, setVehicleNames] = useState({});
  const [driverNames, setDriverNames] = useState({});
  const [lineNames, setLineNames] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const p = await pb.collection('parkings').getOne(id, { $autoCancel: false });
        setParking(p);

        const aRes = await pb.collection('vehicle_assignments').getList(1, 50, {
          filter: `parking_id = "${id}"`,
          sort: '-created', $autoCancel: false,
        });
        const items = aRes.items || [];
        setAssignments(items);

        const vIds = [...new Set(items.map(a => a.vehicle_id).filter(Boolean))];
        const dIds = [...new Set(items.map(a => a.driver_id).filter(Boolean))];
        const lIds = [...new Set(items.map(a => a.line_id).filter(Boolean))];

        const [vRes, lRes] = await Promise.all([
          vIds.length > 0 ? pb.collection('vehicles').getList(1, 50, { filter: vIds.map(vid => `id = "${vid}"`).join(' || '), fields: 'id,plate,moto_number,brand,model', $autoCancel: false }).catch(() => ({ items: [] })) : { items: [] },
          lIds.length > 0 ? pb.collection('lines').getList(1, 50, { filter: lIds.map(lid => `id = "${lid}"`).join(' || '), fields: 'id,name', $autoCancel: false }).catch(() => ({ items: [] })) : { items: [] },
        ]);

        const vMap = {}; (vRes.items || []).forEach(v => { vMap[v.id] = `${v.plate || v.moto_number || 'N/A'} ${v.brand ? `(${v.brand})` : ''}`.trim(); });
        setVehicleNames(vMap);
        const lMap = {}; (lRes.items || []).forEach(l => { lMap[l.id] = l.name; });
        setLineNames(lMap);

        if (dIds.length > 0) {
          const dRes = await pb.collection('drivers').getList(1, 50, { filter: dIds.map(did => `id = "${did}"`).join(' || '), fields: 'id,member_id', $autoCancel: false }).catch(() => ({ items: [] }));
          const dMembers = await Promise.all((dRes.items || []).map(async (d) => {
            if (d.member_id) {
              try {
                const m = await pb.collection('members').getOne(d.member_id, { fields: 'name', $autoCancel: false });
                return { id: d.id, name: m.name };
              } catch (e) { return { id: d.id, name: 'Inconnu' }; }
            }
            return { id: d.id, name: 'Inconnu' };
          }));
          const dMap = {}; dMembers.forEach(d => { dMap[d.id] = d.name; });
          setDriverNames(dMap);
        }
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les détails du parking.');
      } finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
        <Header /><div className="flex-1 flex"><AppSidebar /><main className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></main></div>
      </div>
    );
  }

  if (error || !parking) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
        <Header /><div className="flex-1 flex"><AppSidebar /><main className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-bold">{error || 'Parking introuvable.'}</p>
          <button onClick={() => navigate('/parkings')} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Retour</button>
        </main></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <button onClick={() => navigate('/parkings')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Retour aux parkings
            </button>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Info Card */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold text-foreground">{parking.name}</h1>
                      <StatusBadge status={parking.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{parking.location || 'Aucune adresse'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-muted/30 rounded-xl p-4 text-center">
                    <User className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Responsable</p>
                    <p className="text-sm font-bold text-foreground">{parking.manager_name || 'Non assigné'}</p>
                  </div>
                  {parking.manager_phone && (
                    <div className="bg-muted/30 rounded-xl p-4 text-center">
                      <Phone className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Téléphone</p>
                      <p className="text-sm font-bold text-foreground">{parking.manager_phone}</p>
                    </div>
                  )}
                  <div className="bg-muted/30 rounded-xl p-4 text-center">
                    <Target className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Objectif/Jour</p>
                    <p className="text-sm font-bold text-foreground">{parking.daily_target} Membres</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 text-center">
                    <DollarSign className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Taux/Jour</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(parking.daily_rate)}</p>
                  </div>
                </div>
              </div>

              {/* Assignments Section */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5" /> Affectations ({assignments.length})
                  </h3>
                  <Link to={`/assignments/new`}
                    className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                    + Ajouter
                  </Link>
                </div>

                {assignments.length === 0 ? (
                  <div className="py-8 text-center">
                    <ClipboardCheck className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm text-foreground font-medium">Aucune affectation pour ce parking.</p>
                    <Link to={`/assignments/new`}
                      className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                      + Créer une affectation
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignments.map(a => {
                      const statusColor = a.status === 'active' ? 'text-green-500' : a.status === 'ended' ? 'text-muted-foreground' : 'text-destructive';
                      return (
                        <Link key={a.id} to={`/assignments/${a.id}`}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                          <div className={`w-8 h-8 rounded-full ${statusColor}/10 flex items-center justify-center`}>
                            <ClipboardCheck className={`w-4 h-4 ${statusColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{vehicleNames[a.vehicle_id] || 'Véhicule inconnu'}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {driverNames[a.driver_id] && <span>{driverNames[a.driver_id]}</span>}
                              {lineNames[a.line_id] && <span>· {lineNames[a.line_id]}</span>}
                              <span>· <StatusBadge status={a.status} /></span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ParkingDetailPage;
