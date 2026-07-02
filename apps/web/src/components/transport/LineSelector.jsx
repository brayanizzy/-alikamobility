import React, { useState, useEffect, useRef } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Search, X, Loader2, Route } from 'lucide-react';

const LineSelector = ({ onSelect, selectedLine, placeholder = 'Rechercher une ligne...' }) => {
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const orgId = currentUser?.organization_id;

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); setOpen(false); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await pb.collection('lines').getList(1, 10, {
          filter: `organization_id = "${orgId}" && name ~ "${query}"`,
          sort: 'name', $autoCancel: false,
        });
        setResults(res.items || []);
        setOpen(true);
      } catch { setResults([]); } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, orgId]);

  const handleSelect = (l) => { onSelect(l); setQuery(l.name); setOpen(false); };
  const clearSelection = () => { onSelect(null); setQuery(''); setResults([]); };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={selectedLine ? selectedLine.name : query}
          onChange={(e) => { setQuery(e.target.value); if (selectedLine) onSelect(null); }}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={selectedLine ? '' : placeholder}
          className="w-full bg-background border border-border rounded-xl pl-10 pr-10 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          disabled={!!selectedLine} />
        {selectedLine && <button onClick={clearSelection} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>}
        {loading && !selectedLine && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-modal max-h-60 overflow-y-auto">
          {results.map(l => (
            <button key={l.id} onClick={() => handleSelect(l)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0"><Route className="w-4 h-4 text-amber-500" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{l.name}</p>
                <p className="text-[10px] text-muted-foreground">{l.departure} → {l.arrival}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-modal p-4 text-center">
          <p className="text-sm text-muted-foreground">Aucune ligne trouvée</p>
        </div>
      )}
    </div>
  );
};

export default LineSelector;
