import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import PaginationControls from '@/components/PaginationControls.jsx';
import { CreditCard, Loader2, Plus, Search, AlertCircle, User, Calendar } from 'lucide-react';

const PAGE_SIZE = 15;

const STATUS_OPTIONS = ['', 'active', 'expired', 'lost', 'replaced', 'cancelled'];
const STATUS_LABELS = { '': 'Tous', active: 'Actif', expired: 'Expiré', lost: 'Perdu', replaced: 'Remplacé', cancelled: 'Annulé' };

const MemberCardsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [memberNames, setMemberNames] = useState({});

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = [`organization_id = "${currentUser.organization_id}"`];
      if (statusFilter) filters.push(`status = "${statusFilter}"`);

      const res = await pb.collection('member_cards').getList(page, PAGE_SIZE, {
        filter: filters.join(' && '),
        sort: '-created',
        $autoCancel: false,
      });
      setCards(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalItems(res.totalItems || 0);

      const mIds = [...new Set((res.items || []).map(c => c.member_id).filter(Boolean))];
      if (mIds.length > 0) {
        const mRes = await pb.collection('members').getList(1, 500, {
          filter: mIds.map(mid => `id = "${mid}"`).join(' || '),
          fields: 'id,name',
          $autoCancel: false,
        }).catch(() => ({ items: [] }));
        const mMap = {}; (mRes.items || []).forEach(m => { mMap[m.id] = m.name; });
        setMemberNames(mMap);
      }
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les cartes membres.');
    } finally { setLoading(false); }
  }, [page, statusFilter, currentUser.organization_id]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const filtered = cards.filter(c =>
    !search || c.card_number?.toLowerCase().includes(search.toLowerCase()) ||
    (memberNames[c.member_id] || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Cartes Membres</h1>
                <p className="text-sm text-muted-foreground mt-1">Gérer les cartes membres</p>
              </div>
              <button
                onClick={() => navigate('/member-cards/new')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Nouvelle carte</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher par numéro ou membre..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-4 py-3 rounded-xl bg-card border border-border text-foreground focus:border-primary outline-none transition-all"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <p className="text-lg font-bold text-foreground">{error}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <CreditCard className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-bold text-foreground">Aucune carte trouvée</p>
                <p className="text-sm text-muted-foreground">Créez votre première carte membre.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map(card => (
                    <motion.button
                      key={card.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => navigate(`/member-cards/${card.id}`)}
                      className="bg-card border border-border rounded-2xl p-5 text-left hover:shadow-lg hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground truncate font-mono text-sm">
                            {card.card_number}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {card.card_type}
                          </p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          card.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' :
                          card.status === 'expired' ? 'bg-red-500/10 text-red-600' :
                          'bg-gray-500/10 text-gray-600'
                        }`}>
                          {STATUS_LABELS[card.status] || card.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{memberNames[card.member_id] || '---'}</span>
                        {card.issued_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{card.issued_date}</span>}
                      </div>
                    </motion.button>
                  ))}
                </div>
                <div className="mt-4">
                  <PaginationControls page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MemberCardsPage;
