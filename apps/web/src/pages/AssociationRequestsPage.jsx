import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, AlertCircle, Building2, Clock } from 'lucide-react';
import client from '@/lib/apiClient';
import AppSidebar from '@/components/AppSidebar.jsx';
import PaginationControls from '@/components/PaginationControls.jsx';

const statusColors = {
  pending_approval: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  needs_correction: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-muted text-muted-foreground',
};

const planLabels = { starter: 'Starter', pro: 'Pro', premium: 'Premium', enterprise: 'Enterprise' };

const AssociationRequestsPage = () => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchReq = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, perPage: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await client.request('/association-registration-requests', { method: 'GET', params });
      setItems(data.items || []);
      setStats(data.stats || {});
      setTotalItems(data.totalItems || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err?.response?.error || 'Impossible de charger les demandes.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchReq(); }, [fetchReq]);

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      <div className="flex-1 lg:ml-64 p-4 lg:p-8 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Demandes d'association</h1>
          </div>
          <p className="text-muted-foreground text-sm mb-6">Inscriptions publiques en attente de validation</p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-card border border-border rounded-xl p-3">
              <p className="text-xs text-muted-foreground">En attente</p>
              <p className="text-xl font-bold text-amber-600">{stats.pending_approval || 0}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Approuvées</p>
              <p className="text-xl font-bold text-green-600">{stats.approved || 0}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Rejetées</p>
              <p className="text-xl font-bold text-red-600">{stats.rejected || 0}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-foreground">{totalItems}</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mb-4">
            <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchReq(); }} className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher (nom, responsable, email)..."
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </form>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="h-10 px-3 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Tous statuts</option>
              <option value="pending_approval">En attente</option>
              <option value="approved">Approuvées</option>
              <option value="rejected">Rejetées</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Aucune demande trouvée.</div>
          ) : (
            <div className="space-y-3">
              {items.map((r) => (
                <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground">{r.association_name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${statusColors[r.status] || 'bg-muted'}`}>{r.status === 'pending_approval' ? 'En attente' : r.status}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">{planLabels[r.plan_code] || r.plan_code}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                        <p>👤 {r.manager_name}</p>
                        <p>📞 {r.manager_phone}</p>
                        <p>✉️ {r.manager_email}</p>
                        <p>📍 {r.city}{r.province ? ', ' + r.province : ''}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Clock className="w-3 h-3" /> {r.submitted_at}</p>
                    </div>
                    <div className="flex gap-2">
                      <button disabled className="text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 font-medium opacity-50 cursor-not-allowed" title="Prévu REV-03.2">Approuver</button>
                      <button disabled className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700 font-medium opacity-50 cursor-not-allowed" title="Prévu REV-03.2">Rejeter</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <PaginationControls page={page} totalPages={totalPages} onPage={setPage} totalItems={totalItems} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AssociationRequestsPage;
