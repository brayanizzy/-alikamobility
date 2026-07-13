import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import pb from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Search, X, Loader2, User, Plus } from 'lucide-react';

const MemberSelector = ({ onSelect, selectedMember, orgId, excludeMemberIds = [], placeholder = 'Rechercher un membre...' }) => {
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const organizationId = orgId || currentUser?.organization_id;

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
      setFetchError(null);
      setOpen(false);
      return;
    }
    setFetchError(null);
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        if (!organizationId) {
          setResults([]);
          setFetchError('Aucune organisation associée.');
          return;
        }
        const filter = `organization_id = "${organizationId}" && (name ~ "${query}" || phone ~ "${query}" || code_member ~ "${query}")`;
        const res = await pb.collection('members').getList(1, 10, { filter, sort: 'name', $autoCancel: false });

        let items = res.items || [];
        if (excludeMemberIds.length > 0) {
          items = items.filter(m => !excludeMemberIds.includes(m.id));
        }
        setResults(items);
        setOpen(true);
      } catch {
        setResults([]);
        setFetchError('Erreur de recherche. Vérifiez votre connexion.');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, organizationId]);

  const handleSelect = (member) => {
    onSelect(member);
    setQuery(member.name || member.email || '');
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
        <input
          type="text"
          value={selectedMember ? (selectedMember.name || selectedMember.email || selectedMember.phone || 'Sélectionné') : query}
          onChange={(e) => { setQuery(e.target.value); if (selectedMember) onSelect(null); }}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={selectedMember ? '' : placeholder}
          className="w-full bg-background border border-border rounded-xl pl-10 pr-10 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          disabled={!!selectedMember}
        />
        {selectedMember && (
          <button onClick={clearSelection} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
        {loading && !selectedMember && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-modal max-h-60 overflow-y-auto">
          {results.map((member) => (
            <button
              key={member.id}
              onClick={() => handleSelect(member)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{member.name || member.email}</p>
                <p className="text-[10px] text-muted-foreground">
                  {member.code_member && <span className="font-mono">{member.code_member}</span>}
                  {member.phone && <span className="ml-2">{member.phone}</span>}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-modal p-4 text-center">
          <p className="text-sm text-muted-foreground mb-3">{fetchError || 'Aucun membre trouvé'}</p>
          <Link to="/members/new"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Créer un nouveau membre
          </Link>
        </div>
      )}
    </div>
  );
};

export default MemberSelector;
