import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import VehicleSelector from '@/components/transport/VehicleSelector.jsx';
import DriverSelector from '@/components/transport/DriverSelector.jsx';
import LineSelector from '@/components/transport/LineSelector.jsx';
import ParkingSelector from '@/components/transport/ParkingSelector.jsx';
import { AlertCircle } from 'lucide-react';

const AssignmentForm = ({ initialData, onSubmit, submitLabel = 'Enregistrer', submitting = false }) => {
  const { currentUser } = useAuth();
  const [form, setForm] = useState({
    vehicle_id: initialData?.vehicle_id || '',
    driver_id: initialData?.driver_id || '',
    line_id: initialData?.line_id || '',
    parking_id: initialData?.parking_id || '',
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    status: initialData?.status || 'active',
    notes: initialData?.notes || '',
  });
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedParking, setSelectedParking] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleVehicleSelect = (v) => {
    setSelectedVehicle(v);
    handleChange('vehicle_id', v?.id || '');
  };
  const handleDriverSelect = (d) => {
    setSelectedDriver(d);
    handleChange('driver_id', d?.id || '');
  };
  const handleLineSelect = (l) => {
    setSelectedLine(l);
    handleChange('line_id', l?.id || '');
  };
  const handleParkingSelect = (p) => {
    setSelectedParking(p);
    handleChange('parking_id', p?.id || '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.vehicle_id) { setError('Le véhicule est requis.'); return; }
    if (!form.start_date) { setError('La date de début est requise.'); return; }
    if (form.end_date && form.start_date && new Date(form.end_date) < new Date(form.start_date)) {
      setError('La date de fin ne peut pas être avant la date de début.'); return;
    }
    setError(null);
    onSubmit({ ...form, organization_id: currentUser?.organization_id });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Véhicule *</label>
        <VehicleSelector onSelect={handleVehicleSelect} selectedVehicle={selectedVehicle} />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Chauffeur (optionnel)</label>
        <DriverSelector onSelect={handleDriverSelect} selectedDriver={selectedDriver} />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Ligne (optionnelle)</label>
        <LineSelector onSelect={handleLineSelect} selectedLine={selectedLine} />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Parking (optionnel)</label>
        <ParkingSelector onSelect={handleParkingSelect} selectedParking={selectedParking} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Date de Début *</label>
          <input type="date" value={form.start_date} onChange={(e) => handleChange('start_date', e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Date de Fin (optionnelle)</label>
          <input type="date" value={form.end_date} onChange={(e) => handleChange('end_date', e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Statut</label>
        <select value={form.status} onChange={(e) => handleChange('status', e.target.value)}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
          <option value="active">Active</option>
          <option value="ended">Terminée</option>
          <option value="cancelled">Annulée</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Notes</label>
        <textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={3}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
          placeholder="Informations complémentaires..." />
      </div>

      <button type="submit" disabled={submitting}
        className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none">
        {submitting ? 'Enregistrement...' : submitLabel}
      </button>
    </form>
  );
};

export default AssignmentForm;
