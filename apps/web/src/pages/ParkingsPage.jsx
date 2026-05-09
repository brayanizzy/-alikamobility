import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Loader2, MapPin, Plus, Edit2, Trash2, ShieldBan, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const ParkingsPage = () => {
  const { currentUser } = useAuth();
  const [parkings, setParkings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    manager_name: '',
    manager_phone: '',
    daily_rate: 500,
    daily_target: 100,
    status: 'active'
  });

  const fetchParkings = async () => {
    try {
      setIsLoading(true);
      const records = await pb.collection('parkings').getFullList({
        filter: `organization_id = "${currentUser.organization_id}"`,
        sort: '-created',
        $autoCancel: false
      });
      setParkings(records);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement des parkings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.organization_id) fetchParkings();
  }, [currentUser]);

  const handleOpenModal = (parking = null) => {
    if (parking) {
      setEditingId(parking.id);
      setFormData({
        name: parking.name,
        location: parking.location || '',
        manager_name: parking.manager_name || '',
        manager_phone: parking.manager_phone || '',
        daily_rate: parking.daily_rate,
        daily_target: parking.daily_target || 100,
        status: parking.status || 'active'
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        location: '',
        manager_name: '',
        manager_phone: '',
        daily_rate: 500,
        daily_target: 100,
        status: 'active'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, organization_id: currentUser.organization_id };
      
      if (editingId) {
        await pb.collection('parkings').update(editingId, data, { $autoCancel: false });
        toast.success('Parking mis à jour');
      } else {
        await pb.collection('parkings').create(data, { $autoCancel: false });
        toast.success('Parking créé avec succès');
      }
      
      setShowModal(false);
      fetchParkings();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const toggleStatus = async (parking) => {
    try {
      const newStatus = parking.status === 'active' ? 'suspended' : 'active';
      await pb.collection('parkings').update(parking.id, { status: newStatus }, { $autoCancel: false });
      toast.success(`Parking ${newStatus === 'active' ? 'activé' : 'suspendu'}`);
      fetchParkings();
    } catch (err) {
      toast.error('Erreur de changement de statut');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Parkings</h1>
            <p className="text-muted-foreground mt-1">Gérez les lieux de recouvrement et leurs responsables</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Ajouter un Parking
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : parkings.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-sm">
            <MapPin className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Aucun parking</h3>
            <p className="text-muted-foreground mb-6">Commencez par créer votre premier parking de recouvrement.</p>
            <button onClick={() => handleOpenModal()} className="text-primary font-bold hover:underline">Créer un parking</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parkings.map(parking => (
              <motion.div 
                key={parking.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-card border ${parking.status === 'suspended' ? 'border-destructive/50 opacity-80' : 'border-border'} rounded-2xl p-6 shadow-sm flex flex-col relative`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleStatus(parking)} title={parking.status === 'active' ? 'Suspendre' : 'Activer'} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                      {parking.status === 'active' ? <ShieldBan className="w-5 h-5 text-destructive" /> : <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    </button>
                    <button onClick={() => handleOpenModal(parking)} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-1">{parking.name}</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-1">{parking.location || 'Aucune adresse'}</p>

                <div className="space-y-3 mt-auto pt-4 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Responsable:</span>
                    <span className="font-medium text-foreground">{parking.manager_name || 'Non assigné'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Objectif/Jour:</span>
                    <span className="font-bold text-primary">{parking.daily_target} Membres</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taux / Jour:</span>
                    <span className="font-medium text-foreground">{parking.daily_rate} XAF</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">{editingId ? 'Modifier' : 'Nouveau'} Parking</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Nom du Parking *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="Ex: Parking Marché Central" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Responsable</label>
                  <input type="text" value={formData.manager_name} onChange={e => setFormData({...formData, manager_name: e.target.value})} className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="Nom" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
                  <input type="tel" value={formData.manager_phone} onChange={e => setFormData({...formData, manager_phone: e.target.value})} className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="+243..." />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Adresse / Localisation</label>
                <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="Commune, Quartier..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Tarif Journalier (XAF)</label>
                  <input required type="number" value={formData.daily_rate} onChange={e => setFormData({...formData, daily_rate: Number(e.target.value)})} className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Objectif Collecte/Jour</label>
                  <input required type="number" value={formData.daily_target} onChange={e => setFormData({...formData, daily_target: Number(e.target.value)})} className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:ring-2 focus:ring-primary outline-none" />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-xl bg-muted text-foreground font-bold hover:bg-muted/80 transition-colors">
                  Annuler
                </button>
                <button type="submit" className="flex-[2] py-4 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all">
                  Enregistrer
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ParkingsPage;
