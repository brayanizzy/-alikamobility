import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import {
  ClipboardCheck, Loader2, AlertCircle, ArrowLeft, Edit,
  Truck, User, Route as RouteIcon, MapPin, Calendar
} from 'lucide-react';

const AssignmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicleName, setVehicleName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [lineName, setLineName] = useState('');
  const [parkingName, setParkingName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const a = await pb.collection('vehicle_assignments').getOne(id, { $autoCancel: false });
        setAssignment(a);

        const [vRes, lRes, pRes] = await Promise.all([
          a.vehicle_id ? pb.collection('vehicles').getOne(a.vehicle_id, { $autoCancel: false }).catch(() => null) : null,
          a.line_id ? pb.collection('lines').getOne(a.line_id, { $autoCancel: false }).catch(() => null) : null,
          a.parking_id ? pb.collection('parkings').getOne(a.parking_id, { $autoCancel: false }).catch(() => null) : null,
        ]);
        if (vRes) setVehicleName(`${vRes.plate || vRes.moto_number || 'N/A'} ${vRes.brand ? `(${vRes.brand})` : ''}`.trim());
        if (lRes) setLineName(lRes.name);
        if (pRes) setParkingName(pRes.name);

        if (a.driver_id) {
          const d = await pb.collection('drivers').getOne(a.driver_id, { $autoCancel: false }).catch(() => null);
          if (d?.member_id) {
            const m = await pb.collection('members').getOne(d.member_id, { $autoCancel: false }).catch(() => null);
            if (m) setDriverName(m.name);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les détails de l\'affectation.');
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

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
        <Header /><div className="flex-1 flex"><AppSidebar /><main className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-bold">{error || 'Affectation introuvable.'}</p>
          <button onClick={() => navigate('/assignments')} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Retour</button>
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
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => navigate('/assignments')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Retour à la liste
              </button>
              <Link to={`/assignments/${assignment.id}/edit`}
                className="flex items-center gap-2 bg-primary/10 text-primary font-bold px-4 py-2 rounded-xl hover:bg-primary/20 transition-all text-sm">
                <Edit className="w-4 h-4" /> Modifier
              </Link>
            </div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 shadow-card">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                  <ClipboardCheck className="w-8 h-8 text-indigo-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-foreground">{vehicleName || 'Véhicule inconnu'}</h1>
                    <StatusBadge status={assignment.status} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Éléments liés</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1"><Truck className="w-3 h-3" /> Véhicule</span>
                      <span className="text-sm font-semibold text-foreground">{vehicleName || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> Chauffeur</span>
                      <span className="text-sm font-semibold text-foreground">{driverName || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1"><RouteIcon className="w-3 h-3" /> Ligne</span>
                      <span className="text-sm font-semibold text-foreground">{lineName || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Parking</span>
                      <span className="text-sm font-semibold text-foreground">{parkingName || '—'}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Période</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Date Début</span>
                      <span className="text-sm font-semibold text-foreground">{assignment.start_date ? new Date(assignment.start_date).toLocaleDateString('fr-FR') : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Date Fin</span>
                      <span className="text-sm font-semibold text-foreground">{assignment.end_date ? new Date(assignment.end_date).toLocaleDateString('fr-FR') : 'Non définie'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {assignment.notes && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</h3>
                  <p className="text-sm text-foreground">{assignment.notes}</p>
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AssignmentDetailPage;
