import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, ChevronRight, Truck, User, Route, MapPin } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge.jsx';

const AssignmentCard = ({ assignment, vehicleName, driverName, lineName, parkingName }) => {
  return (
    <Link to={`/assignments/${assignment.id}`}
      className="block bg-card border border-border rounded-2xl p-5 hover:bg-muted/30 transition-all shadow-card group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center shrink-0">
          <ClipboardCheck className="w-6 h-6 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-foreground truncate">{vehicleName || 'Véhicule inconnu'}</span>
            <StatusBadge status={assignment.status} />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {driverName && <span className="flex items-center gap-1"><User className="w-3 h-3" />{driverName}</span>}
            {lineName && <span className="flex items-center gap-1"><Route className="w-3 h-3" />{lineName}</span>}
            {parkingName && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{parkingName}</span>}
            {!driverName && !lineName && !parkingName && <span>Aucune information</span>}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
};

export default AssignmentCard;
