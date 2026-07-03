import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import VehicleTypeBadge from '@/components/transport/VehicleTypeBadge.jsx';
import ExpiryBadge from '@/components/documents/ExpiryBadge.jsx';
import {
  Truck, Loader2, AlertCircle, ArrowLeft, Edit, FileText, Plus,
  User, MapPin, Car, Palette, Hash, Calendar, Wrench
} from 'lucide-react';

const VehicleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [type, setType] = useState(null);
  const [member, setMember] = useState(null);
  const [parkingName, setParkingName] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const v = await pb.collection('vehicles').getOne(id, { $autoCancel: false });
        setVehicle(v);

        const [typeRes, docsRes] = await Promise.all([
          v.vehicle_type_id ? pb.collection('vehicle_types').getOne(v.vehicle_type_id, { $autoCancel: false }).catch(() => null) : null,
          pb.collection('documents').getList(1, 20, {
            filter: `related_type = "vehicle" && related_id = "${id}"`,
            sort: '-created', $autoCancel: false,
          }).catch(() => ({ items: [] })),
        ]);
        setType(typeRes);
        setDocuments(docsRes.items || []);

        if (v.member_id) {
          pb.collection('members').getOne(v.member_id, { $autoCancel: false })
            .then(m => setMember(m)).catch(() => {});
        }
        if (v.parking_id) {
          pb.collection('parkings').getOne(v.parking_id, { $autoCancel: false })
            .then(p => setParkingName(p.name)).catch(() => {});
        }
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les détails du véhicule.');
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

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
        <Header /><div className="flex-1 flex"><AppSidebar /><main className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-bold">{error || 'Véhicule introuvable.'}</p>
          <button onClick={() => navigate('/vehicles')} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Retour</button>
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
              <button onClick={() => navigate('/vehicles')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Retour à la liste
              </button>
              <div className="flex gap-2">
                <Link to={`/documents/new?related_type=vehicle&related_id=${vehicle.id}`}
                  className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-4 py-2 rounded-xl hover:bg-emerald-500/20 transition-all text-sm">
                  <Plus className="w-4 h-4" /> Document
                </Link>
                <Link to={`/vehicles/${vehicle.id}/edit`}
                  className="flex items-center gap-2 bg-primary/10 text-primary font-bold px-4 py-2 rounded-xl hover:bg-primary/20 transition-all text-sm">
                  <Edit className="w-4 h-4" /> Modifier
                </Link>
              </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Vehicle Info Card */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                    <Truck className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold text-foreground">{vehicle.plate || vehicle.moto_number || 'N/A'}</h1>
                      <StatusBadge status={vehicle.status} />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {type && <VehicleTypeBadge type={type.name} />}
                      {vehicle.brand && vehicle.model && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Car className="w-3 h-3" /> {vehicle.brand} {vehicle.model}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Informations</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1"><Hash className="w-3 h-3" /> Plaque</span>
                        <span className="text-sm font-semibold text-foreground">{vehicle.plate || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1"><Wrench className="w-3 h-3" /> N° Moto/Taxi</span>
                        <span className="text-sm font-semibold text-foreground">{vehicle.moto_number || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1"><Car className="w-3 h-3" /> Marque</span>
                        <span className="text-sm font-semibold text-foreground">{vehicle.brand || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1"><Car className="w-3 h-3" /> Modèle</span>
                        <span className="text-sm font-semibold text-foreground">{vehicle.model || '—'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Détails</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Année</span>
                        <span className="text-sm font-semibold text-foreground">{vehicle.year || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1"><Palette className="w-3 h-3" /> Couleur</span>
                        <span className="text-sm font-semibold text-foreground">{vehicle.color || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1"><Hash className="w-3 h-3" /> Châssis</span>
                        <span className="text-sm font-semibold text-foreground">{vehicle.chassis_number || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> Propriétaire</span>
                        <span className="text-sm font-semibold text-foreground">{member?.name || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Parking</span>
                        <span className="text-sm font-semibold text-foreground">{parkingName || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {vehicle.notes && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</h3>
                    <p className="text-sm text-foreground">{vehicle.notes}</p>
                  </div>
                )}
              </div>

              {/* Documents Section */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Documents
                  </h3>
                  <Link to={`/documents/new?related_type=vehicle&related_id=${vehicle.id}`}
                    className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Ajouter
                  </Link>
                </div>

                {documents.length === 0 ? (
                  <div className="py-8 text-center">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm text-foreground font-medium">Ce véhicule n'a pas encore de document enregistré.</p>
                    <Link to={`/documents/new?related_type=vehicle&related_id=${vehicle.id}`}
                      className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                      <Plus className="w-3 h-3" /> Ajouter un document
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map(doc => (
                      <Link key={doc.id} to={`/documents/${doc.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{doc.label || doc.document_type}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{doc.document_type}</span>
                            {doc.expiry_date && <ExpiryBadge expiryDate={doc.expiry_date} />}
                          </div>
                        </div>
                      </Link>
                    ))}
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

export default VehicleDetailPage;
