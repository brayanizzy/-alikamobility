import React, { useState, useEffect } from 'react';
import pb from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import OwnerSelector from '@/components/transport/OwnerSelector.jsx';
import ParkingSelector from '@/components/transport/ParkingSelector.jsx';
import { Loader2, AlertCircle } from 'lucide-react';

const VehicleForm = ({ initialData, onSubmit, submitLabel = 'Enregistrer', submitting = false }) => {
  const { currentUser } = useAuth();
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [form, setForm] = useState({
    vehicle_type_id: '',
    owner_id: '',
    member_id: '',
    parking_id: '',
    plate: '',
    moto_number: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    chassis_number: '',
    status: 'active',
    notes: '',
  });
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [selectedParking, setSelectedParking] = useState(null);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await pb.collection('vehicle_types').getList(1, 50, {
          sort: 'name',
          $autoCancel: false,
        });
        setVehicleTypes(res.items || []);
      } catch (err) {
        console.error('Error fetching vehicle types:', err);
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm({
        vehicle_type_id: initialData.vehicle_type_id || '',
        owner_id: initialData.owner_id || '',
        member_id: initialData.member_id || '',
        parking_id: initialData.parking_id || '',
        plate: initialData.plate || '',
        moto_number: initialData.moto_number || '',
        brand: initialData.brand || '',
        model: initialData.model || '',
        year: initialData.year || '',
        color: initialData.color || '',
        chassis_number: initialData.chassis_number || '',
        status: initialData.status || 'active',
        notes: initialData.notes || '',
      });
      if (initialData.parking_id) {
        pb.collection('parkings').getOne(initialData.parking_id, { $autoCancel: false })
          .then(p => setSelectedParking(p)).catch(() => {});
      }
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleOwnerSelect = (owner) => {
    setSelectedOwner(owner);
    handleChange('owner_id', owner?.id || '');
    handleChange('member_id', owner?.member_id || '');
  };

  const handleParkingSelect = (parking) => {
    setSelectedParking(parking);
    handleChange('parking_id', parking?.id || '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.plate && !form.moto_number) {
      setError('Veuillez renseigner au moins la plaque ou le numéro moto/taxi.');
      return;
    }
    if (form.year && (isNaN(form.year) || form.year < 1900 || form.year > 2100)) {
      setError('L\'année doit être valide (ex: 2024).');
      return;
    }
    setError(null);
    onSubmit({
      ...form,
      organization_id: currentUser?.organization_id,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Type de Véhicule</label>
          {loadingTypes ? (
            <div className="flex items-center gap-2 py-3"><Loader2 className="w-4 h-4 animate-spin text-primary" /><span className="text-sm text-muted-foreground">Chargement...</span></div>
          ) : (
            <select value={form.vehicle_type_id} onChange={(e) => handleChange('vehicle_type_id', e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
              <option value="">Sélectionner un type</option>
              {vehicleTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Statut</label>
          <select value={form.status} onChange={(e) => handleChange('status', e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
            <option value="active">Actif</option>
            <option value="suspended">Suspendu</option>
            <option value="out_of_service">En panne</option>
            <option value="retired">Retiré</option>
            <option value="sold">Vendu</option>
            <option value="pending">En attente</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Propriétaire</label>
        <OwnerSelector onSelect={handleOwnerSelect} selectedOwner={selectedOwner} />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Parking</label>
        <ParkingSelector onSelect={handleParkingSelect} selectedParking={selectedParking} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Plaque d'Immatriculation</label>
          <input type="text" value={form.plate} onChange={(e) => handleChange('plate', e.target.value)}
            placeholder="Ex: 1234 AA / 01"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Numéro Moto/Taxi</label>
          <input type="text" value={form.moto_number} onChange={(e) => handleChange('moto_number', e.target.value)}
            placeholder="Numéro d'identification"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Marque</label>
          <input type="text" value={form.brand} onChange={(e) => handleChange('brand', e.target.value)}
            placeholder="Ex: Toyota, Honda"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Modèle</label>
          <input type="text" value={form.model} onChange={(e) => handleChange('model', e.target.value)}
            placeholder="Ex: Corolla, Civic"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Année</label>
          <input type="number" value={form.year} onChange={(e) => handleChange('year', e.target.value)}
            placeholder="Ex: 2024" min="1900" max="2100"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Couleur</label>
          <input type="text" value={form.color} onChange={(e) => handleChange('color', e.target.value)}
            placeholder="Ex: Rouge, Bleu"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Numéro Châssis</label>
          <input type="text" value={form.chassis_number} onChange={(e) => handleChange('chassis_number', e.target.value)}
            placeholder="Numéro de série"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Notes</label>
        <textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={3}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
          placeholder="Informations complémentaires..." />
      </div>

      <button type="submit" disabled={submitting}
        className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none">
        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
        {submitting ? 'Enregistrement...' : submitLabel}
      </button>
    </form>
  );
};

export default VehicleForm;
