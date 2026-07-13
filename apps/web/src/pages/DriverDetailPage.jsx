import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import PersonRoleBadge from '@/components/people/PersonRoleBadge.jsx';
import RecentActivityList from '@/components/dashboard/RecentActivityList.jsx';
import {
  UserCircle, Loader2, AlertCircle, ArrowLeft, Edit, Calendar, Phone,
  CreditCard, FileText, Activity, Shield, Truck, Route, MapPin
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency.js';

const DriverDetailPage = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [member, setMember] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [assignedVehicle, setAssignedVehicle] = useState(null);
  const [assignedLine, setAssignedLine] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const driverRes = await pb.collection('drivers').getOne(id, { $autoCancel: false });
        setDriver(driverRes);

        if (driverRes.member_id) {
          const memberRes = await pb.collection('members').getOne(driverRes.member_id, { $autoCancel: false });
          setMember(memberRes);

          const paymentsRes = await pb.collection('payments').getList(1, 5, {
            filter: `member_id = "${driverRes.member_id}"`,
            sort: '-created',
            $autoCancel: false,
          });
          setRecentPayments((paymentsRes.items || []).map(p => ({
            id: p.id,
            title: 'Paiement',
            amount: p.amount,
            created: p.created,
          })));
        }

        const assignmentsRes = await pb.collection('vehicle_assignments').getList(1, 1, {
          filter: `driver_id = "${driverRes.id}" && status = "active"`,
          sort: '-created',
          $autoCancel: false,
        });
        const activeAssignment = (assignmentsRes.items || [])[0];
        if (activeAssignment) {
          setAssignment(activeAssignment);
          const [vRes, lRes] = await Promise.all([
            activeAssignment.vehicle_id
              ? pb.collection('vehicles').getOne(activeAssignment.vehicle_id, { $autoCancel: false }).catch(() => null)
              : Promise.resolve(null),
            activeAssignment.line_id
              ? pb.collection('lines').getOne(activeAssignment.line_id, { $autoCancel: false }).catch(() => null)
              : Promise.resolve(null),
          ]);
          setAssignedVehicle(vRes);
          setAssignedLine(lRes);
        }
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les détails du chauffeur.');
      } finally {
        setLoading(false);
      }
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

  if (error || !driver) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
        <Header /><div className="flex-1 flex"><AppSidebar /><main className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-bold">{error || 'Chauffeur introuvable.'}</p>
          <button onClick={() => navigate('/drivers')} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Retour</button>
        </main></div>
      </div>
    );
  }

  const isExpiring = driver.license_expiry && new Date(driver.license_expiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && new Date(driver.license_expiry) > new Date();
  const isExpired = driver.license_expiry && new Date(driver.license_expiry) < new Date();
  const medicalExpiring = driver.medical_cert_expiry && new Date(driver.medical_cert_expiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && new Date(driver.medical_cert_expiry) > new Date();
  const medicalExpired = driver.medical_cert_expiry && new Date(driver.medical_cert_expiry) < new Date();

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            <button onClick={() => navigate('/drivers')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Retour à la liste
            </button>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Profile Card */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <UserCircle className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-bold text-foreground">{member?.name || 'Membre inconnu'}</h1>
                        <StatusBadge status={driver.status} />
                      </div>
                      <div className="flex items-center gap-2">
                        <PersonRoleBadge role="driver" />
                        {member?.phone && <span className="text-sm text-muted-foreground">• {member.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <Link to={`/drivers/${driver.id}/edit`}
                    className="flex items-center gap-2 bg-primary/10 text-primary font-bold px-4 py-2 rounded-xl hover:bg-primary/20 transition-all text-sm">
                    <Edit className="w-4 h-4" /> Modifier
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* License Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Permis de Conduire
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Numéro</span>
                        <span className="text-sm font-semibold text-foreground">{driver.license_number || 'Non renseigné'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Catégorie</span>
                        <span className="text-sm font-semibold text-foreground">{driver.license_category || 'Non renseigné'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Expiration</span>
                        <span className={`text-sm font-semibold flex items-center gap-1.5 ${isExpired ? 'text-red-500' : isExpiring ? 'text-amber-500' : 'text-foreground'}`}>
                          <Calendar className="w-3 h-3" />
                          {driver.license_expiry ? new Date(driver.license_expiry).toLocaleDateString('fr-FR') : 'Non renseignée'}
                          {isExpired && <StatusBadge status="expired" />}
                          {isExpiring && <StatusBadge status="pending" label="Expire bientôt" />}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Medical Certificate */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Certificat Médical
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Expiration</span>
                        <span className={`text-sm font-semibold flex items-center gap-1.5 ${medicalExpired ? 'text-red-500' : medicalExpiring ? 'text-amber-500' : 'text-foreground'}`}>
                          <Calendar className="w-3 h-3" />
                          {driver.medical_cert_expiry ? new Date(driver.medical_cert_expiry).toLocaleDateString('fr-FR') : 'Non renseignée'}
                          {medicalExpired && <StatusBadge status="expired" />}
                          {medicalExpiring && <StatusBadge status="pending" label="Expire bientôt" />}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {driver.notes && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Notes
                    </h3>
                    <p className="text-sm text-foreground">{driver.notes}</p>
                  </div>
                )}
              </div>

              {/* Member Info */}
              {member && (
                <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <UserCircle className="w-4 h-4" /> Informations Membre
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Nom</p>
                      <p className="text-sm font-semibold text-foreground">{member.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Téléphone</p>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-1"><Phone className="w-3 h-3 text-muted-foreground" />{member.phone || 'Non renseigné'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Code Membre</p>
                      <code className="text-sm bg-muted px-2 py-1 rounded text-foreground">{member.code_member || '—'}</code>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Statut Membre</p>
                      <StatusBadge status={member.status} />
                    </div>
                  </div>
                </div>
              )}

              {/* Vehicle & Line Assignment */}
              {assignment && (
                <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Assignation en Cours
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignedVehicle && (
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Truck className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{assignedVehicle.plate || assignedVehicle.moto_number || 'N/A'}</p>
                          <p className="text-[11px] text-muted-foreground">{assignedVehicle.brand} {assignedVehicle.model}</p>
                          {assignedVehicle.vehicle_type_id && (
                            <p className="text-[11px] text-muted-foreground">Type: {assignedVehicle.vehicle_type_id}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {assignedLine && (
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Route className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{assignedLine.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {assignedLine.departure || assignedLine.start_point || '?'} → {assignedLine.arrival || assignedLine.end_point || '?'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {assignment.start_date && (
                    <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Depuis le {new Date(assignment.start_date).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              )}

              {/* Recent Payments */}
              <RecentActivityList
                items={recentPayments}
                type="payment"
                title="Paiements Récents"
                viewAllLink={member ? `/payment-history?member=${member.id}` : undefined}
                maxItems={5}
              />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DriverDetailPage;
