import React, { useState, useEffect, useRef } from 'react';
import pb from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Search, X, Loader2, User } from 'lucide-react';

const OwnerSelector = ({ onSelect, selectedOwner, placeholder = 'Rechercher un propriétaire...' }) => {
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const organizationId = currentUser?.organization_id;

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const ownerRes = await pb.collection('owners').getList(1, 10, {
          filter: `organization_id = "${organizationId}"`,
          sort: '-created',
          $autoCancel: false,
        });
        const ownerItems = ownerRes.items || [];
        const memberIds = ownerItems.map(o => o.member_id).filter(Boolean);
        let items = [];
        if (memberIds.length > 0) {
          const memberFilter = memberIds.map(id => `id = "${id}"`).join(' || ');
          const memberRes = await pb.collection('members').getList(1, 10, {
            filter: `(${memberFilter}) && (name ~ "${query}" || phone ~ "${query}" || code_member ~ "${query}")`,
            sort: 'name',
            $autoCancel: false,
          });
          const memberMap = {};
          (memberRes.items || []).forEach(m => { memberMap[m.id] = m; });
          items = ownerItems.map(o => ({ ...o, _member: memberMap[o.member_id] })).filter(o => o._member);
        }
        setResults(items);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, organizationId]);

  const handleSelect = (owner) => {
    onSelect(owner);
    setQuery(owner._member?.name || 'Propriétaire sélectionné');
    setOpen(false);
  };

  const clearSelection = () => {
    onSelect(null);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={selectedOwner ? (selectedOwner._member?.name || 'Sélectionné') : query}
          onChange={(e) => { setQuery(e.target.value); if (selectedOwner) onSelect(null); }}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={selectedOwner ? '' : placeholder}
          className="w-full bg-background border border-border rounded-xl pl-10 pr-10 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          disabled={!!selectedOwner}
        />
        {selectedOwner && (
          <button onClick={clearSelection} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
        {loading && !selectedOwner && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-modal max-h-60 overflow-y-auto">
          {results.map((owner) => (
            <button key={owner.id} onClick={() => handleSelect(owner)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{owner._member?.name || 'Membre inconnu'}</p>
                <p className="text-[10px] text-muted-foreground">
                  {owner._member?.phone && <span>{owner._member.phone}</span>}
                  {owner._member?.code_member && <span className="ml-2 font-mono">{owner._member.code_member}</span>}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-modal p-4 text-center">
          <p className="text-sm text-muted-foreground">Aucun propriétaire trouvé</p>
        </div>
      )}
    </div>
  );
};

export default OwnerSelector;
