import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge.jsx';
import PersonRoleBadge from '@/components/people/PersonRoleBadge.jsx';
import PaginationControls from '@/components/PaginationControls.jsx';
import {
  UserCircle, Loader2, AlertCircle, Search, Plus, ChevronRight, Phone
} from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

const OwnersPage = () => {
  const { currentUser } = useAuth();
  const [owners, setOwners] = useState([]);
  const [members, setMembers] = useState({});
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const orgId = currentUser?.organization_id;

  const fetchOwners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await pb.collection('owners').getList(page, perPage, {
        filter: `organization_id = "${orgId}"`,
        sort: '-created',
        $autoCancel: false,
      });

      const items = res.items || [];
      setOwners(items);
      setTotalItems(res.totalItems || 0);

      const memberIds = [...new Set(items.map(o => o.member_id).filter(Boolean))];
      if (memberIds.length > 0) {
        const memberFilter = memberIds.map(id => `id = "${id}"`).join(' || ');
        const membersRes = await pb.collection('members').getList(1, 50, {
          filter: memberFilter,
          $autoCancel: false,
        });
        const memberMap = {};
        (membersRes.items || []).forEach(m => { memberMap[m.id] = m; });
        setMembers(memberMap);
      } else {
        setMembers({});
      }
    } catch (err) {
      console.error('Error fetching owners:', err);
      setError('Impossible de charger les propriétaires.');
    } finally {
      setLoading(false);
    }
  }, [orgId, page, perPage]);

  useEffect(() => { fetchOwners(); }, [fetchOwners]);

  const filteredOwners = search
    ? owners.filter(o => {
        const m = members[o.member_id];
        const name = m?.name || '';
        const phone = m?.phone || '';
        const q = search.toLowerCase();
        return name.toLowerCase().includes(q) || phone.includes(q);
      })
    : owners;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto">
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Propriétaires</h1>
                <p className="text-muted-foreground">Gestion des propriétaires de véhicules.</p>
              </div>
              <Link to="/owners/new"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" /> Ajouter Propriétaire
              </Link>
            </motion.div>

            {/* Search */}
            <motion.div variants={item} className="mb-6">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par nom ou téléphone..."
                  className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
              </div>
            </motion.div>

            {/* Loading */}
            {loading && (
              <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            )}

            {/* Error */}
            {error && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p className="text-lg font-bold text-center">{error}</p>
                <button onClick={fetchOwners} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Réessayer</button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && filteredOwners.length === 0 && (
              <motion.div variants={item} className="text-center py-16">
                <UserCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-xl font-bold text-foreground mb-2">Aucun propriétaire</h3>
                <p className="text-muted-foreground mb-6">Commencez par ajouter un propriétaire.</p>
                <Link to="/owners/new"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all">
                  <Plus className="w-4 h-4" /> Ajouter un Propriétaire
                </Link>
              </motion.div>
            )}

            {/* List */}
            {!loading && !error && filteredOwners.length > 0 && (
              <>
                <motion.div variants={item} className="space-y-3">
                  {filteredOwners.map((owner) => {
                    const member = members[owner.member_id];
                    return (
                      <Link key={owner.id} to={`/owners/${owner.id}`}
                        className="block bg-card border border-border rounded-2xl p-5 hover:bg-muted/30 transition-all shadow-card group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center shrink-0">
                            <UserCircle className="w-6 h-6 text-purple-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-foreground truncate">{member?.name || 'Membre inconnu'}</span>
                              <PersonRoleBadge role="owner" />
                            </div>
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              {member?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{member.phone}</span>}
                              <span className="flex items-center gap-1">Créé le {new Date(owner.created).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    );
                  })}
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

export default OwnersPage;
