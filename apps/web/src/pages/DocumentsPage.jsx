import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import pb from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge.jsx';
import ExpiryBadge from '@/components/documents/ExpiryBadge.jsx';
import PaginationControls from '@/components/PaginationControls.jsx';
import {
  FileText, Loader2, AlertCircle, Search, Plus, Filter, ChevronRight, Calendar
} from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

const DOCUMENT_TYPES = ['vehicle', 'driver', 'member', 'owner'];
const TYPE_LABELS = { vehicle: 'Véhicule', driver: 'Chauffeur', member: 'Membre', owner: 'Propriétaire' };

const DocumentsPage = () => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const orgId = currentUser?.organization_id;

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filterParts = [`organization_id = "${orgId}"`];
      if (typeFilter) filterParts.push(`related_type = "${typeFilter}"`);
      if (statusFilter) filterParts.push(`status = "${statusFilter}"`);

      const res = await pb.collection('documents').getList(page, perPage, {
        filter: filterParts.join(' && '),
        sort: '-created',
        $autoCancel: false,
      });

      setDocuments(res.items || []);
      setTotalItems(res.totalItems || 0);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Impossible de charger les documents.');
    } finally {
      setLoading(false);
    }
  }, [orgId, page, perPage, typeFilter, statusFilter]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const filteredDocuments = search
    ? documents.filter(d => {
        const q = search.toLowerCase();
        return (d.label || '').toLowerCase().includes(q)
          || (d.document_type || '').toLowerCase().includes(q)
          || (d.related_type || '').toLowerCase().includes(q)
          || (d.related_id || '').toLowerCase().includes(q);
      })
    : documents;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto">
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Documents</h1>
                <p className="text-muted-foreground">Gestion des documents liés aux véhicules, chauffeurs et membres.</p>
              </div>
              <Link to="/documents/new"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" /> Ajouter Document
              </Link>
            </motion.div>

            <motion.div variants={item} className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par libellé, type..."
                  className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
              </div>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
                <option value="">Toutes les entités</option>
                {DOCUMENT_TYPES.map(t => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all">
                <option value="">Tous les statuts</option>
                <option value="active">Valide</option>
                <option value="expired">Expiré</option>
                <option value="pending">En attente</option>
                <option value="rejected">Rejeté</option>
                <option value="archived">Archivé</option>
              </select>
            </motion.div>

            {loading && (
              <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p className="text-lg font-bold text-center">{error}</p>
                <button onClick={fetchDocuments}
                  className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Réessayer</button>
              </div>
            )}

            {!loading && !error && filteredDocuments.length === 0 && (
              <motion.div variants={item} className="text-center py-16">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-xl font-bold text-foreground mb-2">Aucun document</h3>
                <p className="text-muted-foreground mb-6">Commencez par ajouter un document.</p>
                <Link to="/documents/new"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all">
                  <Plus className="w-4 h-4" /> Ajouter un Document
                </Link>
              </motion.div>
            )}

            {!loading && !error && filteredDocuments.length > 0 && (
              <>
                <motion.div variants={item} className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground text-sm uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold">Document</th>
                        <th className="px-6 py-4 font-semibold hidden sm:table-cell">Type</th>
                        <th className="px-6 py-4 font-semibold hidden md:table-cell">Entité</th>
                        <th className="px-6 py-4 font-semibold">Expiration</th>
                        <th className="px-6 py-4 font-semibold">Statut</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredDocuments.map((doc) => (
                        <tr key={doc.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-6 py-4">
                            <Link to={`/documents/${doc.id}`} className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-500" />
                              </div>
                              <div>
                                <p className="font-bold text-foreground">{doc.label || doc.document_type || 'Sans libellé'}</p>
                                <p className="text-xs text-muted-foreground">{doc.document_type}</p>
                              </div>
                            </Link>
                          </td>
                          <td className="px-6 py-4 hidden sm:table-cell text-sm text-foreground">{doc.document_type}</td>
                          <td className="px-6 py-4 hidden md:table-cell text-sm text-foreground">
                            {TYPE_LABELS[doc.related_type] || doc.related_type}
                          </td>
                          <td className="px-6 py-4">
                            {doc.expiry_date ? (
                              <ExpiryBadge expiryDate={doc.expiry_date} />
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4"><StatusBadge status={doc.status} /></td>
                          <td className="px-6 py-4 text-right">
                            <Link to={`/documents/${doc.id}`}
                              className="opacity-0 group-hover:opacity-100 inline-flex p-2 bg-card hover:bg-primary/20 text-muted-foreground hover:text-primary rounded-lg border border-transparent hover:border-primary/30 transition-all">
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>

                <motion.div variants={item} className="mt-6">
                  <PaginationControls page={page} totalItems={totalItems} perPage={perPage} onPageChange={setPage} />
                </motion.div>
              </>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DocumentsPage;
