import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, AlertCircle, UserPlus, MoreVertical, Ban, CheckCircle, RotateCcw, KeyRound, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import client from '@/lib/apiClient';
import AppSidebar from '@/components/AppSidebar.jsx';
import PaginationControls from '@/components/PaginationControls.jsx';
import InviteUserForm from '@/components/InviteUserForm.jsx';

const roleLabels = {
  'super-admin': 'Super Admin',
  'admin': 'Admin',
  'agent': 'Agent',
  'field_collector': 'Agent Terrain',
  'office_collector': 'Agent Caissier',
};

const statusColors = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  pending_invite: 'bg-amber-100 text-amber-700',
};

const UsersManagementPage = () => {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super-admin';

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [actionMenu, setActionMenu] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, perPage: 15 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const data = await client.request('/users', { method: 'GET', params });
      setUsers(data.items || []);
      setTotalItems(data.totalItems || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err?.response?.error || 'Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const handleAction = async (userId, action) => {
    setActionMenu(null);
    const actionLabels = {
      'resend-invitation': 'renvoyer l\'invitation',
      'suspend': 'suspendre',
      'reactivate': 'réactiver',
      'force-password-reset': 'forcer le reset',
    };
    if (!confirm(`Confirmer : ${actionLabels[action]} ?`)) return;
    try {
      const res = await client.request(`/users/${userId}/${action}`, { method: 'POST' });
      showToast(res.message || 'Action effectuée.');
      fetchUsers();
    } catch (err) {
      showToast(err?.response?.error || 'Erreur lors de l\'action.', 'error');
    }
  };

  const handleSearchSubmit = (e) => { e.preventDefault(); setPage(1); fetchUsers(); };

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      <div className="flex-1 lg:ml-64 p-4 lg:p-8 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Utilisateurs</h1>
              <p className="text-muted-foreground text-sm">{totalItems} utilisateur(s){!isSuperAdmin && ' de votre organisation'}</p>
            </div>
            <button
              onClick={() => setShowInvite(true)}
              className="bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl hover:brightness-110 transition flex items-center gap-2 text-sm"
            >
              <UserPlus className="w-4 h-4" /> Inviter
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mb-4">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </form>
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="h-10 px-3 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Tous rôles</option>
              {isSuperAdmin && <option value="super-admin">Super Admin</option>}
              <option value="admin">Admin</option>
              <option value="agent">Agent</option>
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="h-10 px-3 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Tous statuts</option>
              <option value="active">Actif</option>
              <option value="suspended">Suspendu</option>
              <option value="pending_invite">En attente</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Aucun utilisateur trouvé.</div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left p-3 font-medium text-muted-foreground">Nom</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Rôle</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Statut</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Invitation</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const rawRole = u.agent_type ? u.agent_type : u.role;
                      return (
                        <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="p-3 font-medium text-foreground">{u.name || '—'}</td>
                          <td className="p-3 text-muted-foreground">{u.email}</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded-md bg-muted text-xs font-medium">{roleLabels[rawRole] || rawRole}</span></td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${statusColors[u.status] || 'bg-muted'}`}>{u.status || '—'}</span>
                          </td>
                          <td className="p-3">
                            {u.invitation ? (
                              <span className={`text-xs ${u.invitation.status === 'pending' ? 'text-amber-600' : u.invitation.status === 'expired' ? 'text-red-600' : 'text-muted-foreground'}`}>
                                {u.invitation.status === 'pending' ? 'En attente' : u.invitation.status === 'expired' ? 'Expirée' : 'Utilisée'}
                              </span>
                            ) : <span className="text-muted-foreground text-xs">—</span>}
                          </td>
                          <td className="p-3 text-right relative">
                            {u.role !== 'super-admin' && (
                              <>
                                <button onClick={() => setActionMenu(actionMenu === u.id ? null : u.id)} className="p-1.5 rounded-lg hover:bg-muted">
                                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                </button>
                                {actionMenu === u.id && (
                                  <div className="absolute right-3 top-full mt-1 z-10 bg-card border border-border rounded-lg shadow-lg py-1 w-52 text-left">
                                    {u.status === 'pending_invite' && (
                                      <button onClick={() => handleAction(u.id, 'resend-invitation')} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Mail className="w-4 h-4" /> Renvoyer l'invitation</button>
                                    )}
                                    {u.status === 'active' && (
                                      <button onClick={() => handleAction(u.id, 'suspend')} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-600"><Ban className="w-4 h-4" /> Suspendre</button>
                                    )}
                                    {u.status === 'suspended' && (
                                      <button onClick={() => handleAction(u.id, 'reactivate')} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-green-600"><CheckCircle className="w-4 h-4" /> Réactiver</button>
                                    )}
                                    <button onClick={() => handleAction(u.id, 'force-password-reset')} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><KeyRound className="w-4 h-4" /> Forcer reset mdp</button>
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && totalPages > 1 && (
            <PaginationControls page={page} totalPages={totalPages} onPage={setPage} totalItems={totalItems} />
          )}
        </div>
      </div>

      {showInvite && <InviteUserForm onClose={() => setShowInvite(false)} onInvited={(res) => showToast(res.message || 'Invitation envoyée.')} />}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.type === 'error' ? 'bg-destructive' : 'bg-primary'}`}>
          {toast.msg}
        </div>
      )}

      {actionMenu && <div className="fixed inset-0 z-40" onClick={() => setActionMenu(null)} />}
    </div>
  );
};

export default UsersManagementPage;
