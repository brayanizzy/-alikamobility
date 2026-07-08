import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, AlertCircle, Building2, Clock, X, CheckCircle2, Ban, Edit3, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import client from '@/lib/apiClient';
import AppSidebar from '@/components/AppSidebar.jsx';
import PaginationControls from '@/components/PaginationControls.jsx';

const statusConfig = {
  pending_approval: { label: 'En attente', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { label: 'Approuvée', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: 'Rejetée', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  needs_correction: { label: 'Correction', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  cancelled: { label: 'Annulée', class: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

const planLabels = { starter: 'Starter', pro: 'Pro', premium: 'Premium', enterprise: 'Enterprise' };
const STATUS_OPTIONS = ['', 'pending_approval', 'approved', 'rejected', 'needs_correction'];

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

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

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

  const openDetail = async (id) => {
    setDetail(null);
    setActionError('');
    setDetailLoading(true);
    try {
      const data = await client.request(`/association-registration-requests/${id}`, { method: 'GET' });
      setDetail(data);
    } catch (err) {
      setActionError(err?.response?.error || 'Impossible de charger le détail.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setActionError('');
  };

  const doApprove = async () => {
    if (!detail) return;
    setActionLoading(true);
    setActionError('');
    try {
      await client.request(`/association-registration-requests/${detail.request.id}/approve`, {
        method: 'POST',
        body: { plan_code: 'starter', subscription_status: 'trial', trial_days: 14 },
      });
      closeDetail();
      fetchReq();
    } catch (err) {
      setActionError(err?.response?.error || 'Erreur lors de l\'approbation.');
    } finally {
      setActionLoading(false);
    }
  };

  const doReject = async () => {
    if (!detail) return;
    setActionLoading(true);
    setActionError('');
    try {
      await client.request(`/association-registration-requests/${detail.request.id}/reject`, {
        method: 'POST',
        body: { reason: 'Informations insuffisantes ou non vérifiables.' },
      });
      closeDetail();
      fetchReq();
    } catch (err) {
      setActionError(err?.response?.error || 'Erreur lors du refus.');
    } finally {
      setActionLoading(false);
    }
  };

  const statCards = [
    { key: 'pending_approval', label: 'En attente', color: 'text-amber-600' },
    { key: 'approved', label: 'Approuvées', color: 'text-green-600' },
    { key: 'rejected', label: 'Rejetées', color: 'text-red-600' },
    { key: null, label: 'Total', color: 'text-foreground', value: totalItems },
  ];

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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {statCards.map((s) => (
              <div key={s.key || 'total'} className="bg-card border border-border rounded-xl p-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value ?? (stats[s.key] || 0)}</p>
              </div>
            ))}
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
              {STATUS_OPTIONS.map((v) => (
                <option key={v} value={v}>{v ? statusConfig[v]?.label || v : 'Tous statuts'}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Aucune demande trouvée.</div>
          ) : (
            <div className="space-y-3">
              {items.map((r) => {
                const sc = statusConfig[r.status] || { label: r.status, class: 'bg-muted text-muted-foreground' };
                return (
                  <div key={r.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => openDetail(r.id)}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-foreground">{r.association_name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${sc.class}`}>{sc.label}</span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">{planLabels[r.plan_code] || r.plan_code}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                          <p className="flex items-center gap-1"><span className="w-4">👤</span> {r.manager_name}</p>
                          <p className="flex items-center gap-1"><span className="w-4">📞</span> {r.manager_phone}</p>
                          <p className="flex items-center gap-1"><span className="w-4">✉️</span> {r.manager_email}</p>
                          <p className="flex items-center gap-1"><span className="w-4">📍</span> {r.city}{r.province ? ', ' + r.province : ''}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Clock className="w-3 h-3" /> {r.submitted_at}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => openDetail(r.id)} title="Voir détail" className="p-2 rounded-lg hover:bg-muted transition-colors">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <PaginationControls page={page} totalPages={totalPages} onPage={setPage} totalItems={totalItems} />
          )}
        </div>
      </div>

      {/* Detail / Decision Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeDetail}>
          <div className="bg-background border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-background z-10 flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-bold text-lg text-foreground">Détail de la demande</h2>
              <button onClick={closeDetail} className="p-2 rounded-lg hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {detailLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <div className="p-4 space-y-4">
                {detail.request && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-semibold text-foreground mb-2">Demande</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <p className="text-muted-foreground">Association : <span className="text-foreground font-medium">{detail.request.association_name}</span></p>
                      <p className="text-muted-foreground">Activité : <span className="text-foreground">{detail.request.activity_type}</span></p>
                      <p className="text-muted-foreground">Province : <span className="text-foreground">{detail.request.province}</span></p>
                      <p className="text-muted-foreground">Ville : <span className="text-foreground">{detail.request.city}</span></p>
                      {detail.request.address && <p className="text-muted-foreground col-span-2">Adresse : <span className="text-foreground">{detail.request.address}</span></p>}
                      <p className="text-muted-foreground">Forfait : <span className="text-foreground font-medium">{planLabels[detail.request.plan_code] || detail.request.plan_code}</span></p>
                      <p className="text-muted-foreground">Date : <span className="text-foreground">{detail.request.submitted_at}</span></p>
                      <p className="text-muted-foreground">Statut : <span className={`inline-block text-xs px-2 py-0.5 rounded-md font-medium ${(statusConfig[detail.request.status] || {}).class || 'bg-muted text-muted-foreground'}`}>{(statusConfig[detail.request.status] || {}).label || detail.request.status}</span></p>
                    </div>
                  </div>
                )}

                {detail.organization && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-semibold text-foreground mb-2">Organisation</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <p className="text-muted-foreground">ID : <span className="text-foreground">{detail.organization.id}</span></p>
                      <p className="text-muted-foreground">Nom : <span className="text-foreground">{detail.organization.name}</span></p>
                      <p className="text-muted-foreground">Statut : <span className="text-foreground font-medium">{detail.organization.status}</span></p>
                      <p className="text-muted-foreground">Email : <span className="text-foreground">{detail.organization.contact_email}</span></p>
                      {detail.organization.approved_at && <p className="text-muted-foreground">Approuvé le : <span className="text-foreground">{detail.organization.approved_at}</span></p>}
                      {detail.organization.rejected_at && <p className="text-muted-foreground">Refusé le : <span className="text-foreground">{detail.organization.rejected_at}</span></p>}
                      {detail.organization.rejection_reason && <p className="text-muted-foreground col-span-2">Motif : <span className="text-foreground">{detail.organization.rejection_reason}</span></p>}
                    </div>
                  </div>
                )}

                {detail.admin_user && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-semibold text-foreground mb-2">Admin responsable</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <p className="text-muted-foreground">Nom : <span className="text-foreground">{detail.admin_user.name}</span></p>
                      <p className="text-muted-foreground">Email : <span className="text-foreground">{detail.admin_user.email}</span></p>
                      <p className="text-muted-foreground">Téléphone : <span className="text-foreground">{detail.admin_user.phone || '—'}</span></p>
                      <p className="text-muted-foreground">Statut : <span className="text-foreground font-medium">{detail.admin_user.status}</span></p>
                    </div>
                  </div>
                )}

                {detail.subscription && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-semibold text-foreground mb-2">Abonnement</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <p className="text-muted-foreground">Statut : <span className="text-foreground font-medium">{detail.subscription.status}</span></p>
                      <p className="text-muted-foreground">Forfait : <span className="text-foreground">{planLabels[detail.subscription.plan_code] || detail.subscription.plan_code}</span></p>
                      {detail.subscription.trial_starts_at && <p className="text-muted-foreground">Essai début : <span className="text-foreground">{detail.subscription.trial_starts_at}</span></p>}
                      {detail.subscription.trial_ends_at && <p className="text-muted-foreground">Essai fin : <span className="text-foreground">{detail.subscription.trial_ends_at}</span></p>}
                      {detail.subscription.starts_at && <p className="text-muted-foreground">Début : <span className="text-foreground">{detail.subscription.starts_at}</span></p>}
                    </div>
                  </div>
                )}

                {detail.request?.review_note && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-semibold text-foreground mb-2">Note d'examen</h3>
                    <p className="text-sm text-foreground">{detail.request.review_note}</p>
                  </div>
                )}

                {actionError && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive font-medium">{actionError}</p>
                  </div>
                )}

                {detail.request?.status === 'pending_approval' || detail.request?.status === 'needs_correction' ? (
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
                    <button onClick={doApprove} disabled={actionLoading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm disabled:opacity-50 transition-colors">
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Approuver
                    </button>
                    <button onClick={doReject} disabled={actionLoading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm disabled:opacity-50 transition-colors">
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                      Refuser
                    </button>
                    <button onClick={() => {
                      const note = prompt('Note de correction à envoyer au demandeur :');
                      if (!note) return;
                      setActionLoading(true);
                      setActionError('');
                      client.request(`/association-registration-requests/${detail.request.id}/request-correction`, {
                        method: 'POST',
                        body: { note },
                      }).then(() => { closeDetail(); fetchReq(); }).catch((err) => {
                        setActionError(err?.response?.error || 'Erreur.');
                      }).finally(() => setActionLoading(false));
                    }} disabled={actionLoading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm disabled:opacity-50 transition-colors">
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
                      Demander correction
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground text-center py-2">Décision déjà prise pour cette demande.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssociationRequestsPage;
