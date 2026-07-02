import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, ChevronRight, Car } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge.jsx';
import VehicleTypeBadge from '@/components/transport/VehicleTypeBadge.jsx';

const VehicleCard = ({ vehicle, ownerName, parkingName, typeName }) => {
  return (
    <Link to={`/vehicles/${vehicle.id}`}
      className="block bg-card border border-border rounded-2xl p-5 hover:bg-muted/30 transition-all shadow-card group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center shrink-0">
          <Truck className="w-6 h-6 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-foreground truncate">{vehicle.plate || vehicle.moto_number || 'N/A'}</span>
            <StatusBadge status={vehicle.status} />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {typeName && <span className="flex items-center gap-1"><Car className="w-3 h-3" />{typeName}</span>}
            {vehicle.brand && vehicle.model && <span>{vehicle.brand} {vehicle.model}</span>}
            {ownerName && <span>{ownerName}</span>}
            {parkingName && <span>{parkingName}</span>}
            {!typeName && !vehicle.brand && !ownerName && !parkingName && <span>Aucune information</span>}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
};

export default VehicleCard;
