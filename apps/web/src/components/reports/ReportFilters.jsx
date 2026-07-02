import React from 'react';
import { Calendar, RotateCcw, Search } from 'lucide-react';

const PERIODS = [
  { key: 'day', label: "Aujourd'hui" },
  { key: 'week', label: '7 jours' },
  { key: 'month', label: '30 jours' },
  { key: 'custom', label: 'Personnalisé' },
];

export default function ReportFilters({
  selectedPeriod, setSelectedPeriod,
  customStart, setCustomStart,
  customEnd, setCustomEnd,
  parkingFilter, setParkingFilter,
  agentFilter, setAgentFilter,
  methodFilter, setMethodFilter,
  statusFilter, setStatusFilter,
  parkings = [],
  agents = [],
  showParking = true,
  showAgent = true,
  showMethod = true,
  showStatus = true,
  onApply,
  onReset,
}) {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex gap-1 bg-card border border-border p-1 rounded-xl">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setSelectedPeriod(p.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedPeriod === p.key
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {selectedPeriod === 'custom' && (
        <>
          <input
            type="date"
            value={customStart}
            onChange={e => setCustomStart(e.target.value)}
            className="bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-36"
          />
          <span className="text-muted-foreground text-xs">à</span>
          <input
            type="date"
            value={customEnd}
            onChange={e => setCustomEnd(e.target.value)}
            className="bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-36"
          />
        </>
      )}
      {showParking && (
        <select
          value={parkingFilter}
          onChange={e => setParkingFilter(e.target.value)}
          className="bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Tous parkings</option>
          {parkings.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}
      {showAgent && (
        <select
          value={agentFilter}
          onChange={e => setAgentFilter(e.target.value)}
          className="bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Tous agents</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.name || a.email}</option>)}
        </select>
      )}
      {showMethod && (
        <select
          value={methodFilter}
          onChange={e => setMethodFilter(e.target.value)}
          className="bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Toutes méthodes</option>
          <option value="cash">Espèces</option>
          <option value="mobile">Mobile Money</option>
          <option value="bank">Banque</option>
          <option value="card">Carte</option>
        </select>
      )}
      {showStatus && (
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Tous statuts</option>
          <option value="pending">En attente</option>
          <option value="active">Actif</option>
          <option value="paid">Payé</option>
          <option value="expired">Expiré</option>
        </select>
      )}
      {onApply && (
        <button
          onClick={onApply}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
        >
          <Search className="w-3.5 h-3.5" /> Appliquer
        </button>
      )}
      {onReset && (
        <button
          onClick={onReset}
          className="bg-card border border-border text-muted-foreground px-3 py-2 rounded-xl text-xs font-bold hover:text-foreground active:scale-95 transition-all flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      )}
    </div>
  );
}
