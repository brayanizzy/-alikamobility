import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Loader2, UserPlus, Edit2, ShieldBan, CheckCircle2, Phone, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';

const AgentsPage = () => {
  const { currentUser } = useAuth();
  const [agents, setAgents] = useState([]);
  const [parkings, setParkings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emptyForm = {
    name: '',
    email: '',
    phone: '',
    role: 'agent',
    parking_id: '',
    password: '',
    passwordConfirm: '',
  };
  const [formData, setFormData] = useState(emptyForm);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [agentsRes, parkingsRes] = await Promise.all([
        pb.collection('users').getFullList({
          filter: `organization_id = "${currentUser.organization_id}" && role != "admin" && role != "super-admin"`,
          sort: '-created',
          $autoCancel: false,
        }),
        pb.collection('parkings').getFullList({
          filter: `organization_id = "${currentUser.organization_id}"`,
          $autoCancel: false,
        }),
      ]);
      setAgents(agentsRes);
      setParkings(parkingsRes);
    } catch (err) {
      console.error(err);
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.organization_id) fetchData();
  }, [currentUser]);

  const handleOpenModal = (agent = null) => {
    if (agent) {
      setEditingId(agent.id);
      setFormData({
        name: agent.name,
        email: agent.email,
        phone: agent.phone || '',
        role: agent.role,
        parking_id: agent.parking_id || '',
        password: '',
        passwordConfirm: '',
      });
    } else {
      setEditingId(null);
      setFormData(emptyForm);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingId && formData.password !== formData.passwordConfirm) {
      return toast.error('Les mots de passe ne correspondent pas');
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        parking_id: formData.parking_id,
        organization_id: currentUser.organization_id,
        status: 'active',
      };

      if (editingId) {
        await pb.collection('users').update(editingId, payload, { $autoCancel: false });
        toast.success('Agent mis à jour');
      } else {
        payload.password = formData.password;
        payload.passwordConfirm = formData.passwordConfirm;
        await pb.collection('users').create(payload, { $autoCancel: false });
        toast.success('Agent créé avec succès !');
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (agent) => {
    try {
      const newStatus = agent.status === 'active' ? 'suspended' : 'active';
      await pb.collection('users').update(agent.id, { status: newStatus }, { $autoCancel: false });
      toast.success(`Agent ${newStatus === 'active' ? 'activé' : 'suspendu'}`);
      fetchData();
    } catch (err) {
      toast.error('Erreur de changement de statut');
    }
  };

  const getParkingName = (id) => parkings.find(p => p.id === id)?.name || '—';

  const roleLabel = { agent: 'Recouvreur', collector: 'Collecteur', admin: 'Admin' };
  const roleColor = { agent: 'bg-blue-500/10 text-blue-400', collector: 'bg-purple-500/10 text-purple-400', admin: 'bg-primary/10 text-primary' };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Agents</h1>
            <p className="text-muted-foreground mt-1">Créez et gérez les agents de recouvrement de votre association</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" /> Ajouter un Agent
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : agents.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-sm">
            <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Aucun agent</h3>
            <p className="text-muted-foreground mb-6">Créez votre premier agent de recouvrement terrain.</p>
            <button onClick={() => handleOpenModal()} className="text-primary font-bold hover:underline">Créer un agent</button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-border">
              {agents.map((agent) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center shrink-0 text-lg font-bold text-foreground">
                      {agent.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-foreground">{agent.name}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${roleColor[agent.role] || 'bg-muted text-muted-foreground'}`}>
                          {roleLabel[agent.role] || agent.role}
                        </span>
                        {agent.status === 'suspended' && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">Suspendu</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1">
                        <p className="text-sm text-muted-foreground">{agent.email}</p>
                        {agent.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />{agent.phone}
                          </p>
                        )}
                        {agent.parking_id && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{getParkingName(agent.parking_id)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0 ml-auto">
                    <button onClick={() => toggleStatus(agent)} title={agent.status === 'active' ? 'Suspendre' : 'Activer'} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
                      {agent.status === 'active' ? <ShieldBan className="w-5 h-5 text-destructive" /> : <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    </button>
                    <button onClick={() => handleOpenModal(agent)} className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted transition-colors">
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 my-4">
            <h2 className="text-2xl font-bold text-foreground mb-6">{editingId ? 'Modifier' : 'Nouvel'} Agent</h2>
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Nom complet *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="John Doe" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Email (identifiant connexion) *</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="agent@example.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="+243..." />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Rôle *</label>
                  <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:ring-2 focus:ring-primary outline-none">
                    <option value="agent">Recouvreur</option>
                    <option value="collector">Collecteur</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Parking assigné</label>
                  <select value={formData.parking_id} onChange={e => setFormData({ ...formData, parking_id: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:ring-2 focus:ring-primary outline-none">
                    <option value="">— Aucun parking —</option>
                    {parkings.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              {!editingId && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">Mot de passe *</label>
                    <input required type="password" minLength={8} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="••••••••" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">Confirmer *</label>
                    <input required type="password" minLength={8} value={formData.passwordConfirm} onChange={e => setFormData({ ...formData, passwordConfirm: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="••••••••" />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-xl bg-muted text-foreground font-bold hover:bg-muted/80 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? 'Mettre à jour' : 'Créer l\'agent')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AgentsPage;
