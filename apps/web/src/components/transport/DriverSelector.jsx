import React, { useState, useEffect, useRef } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Search, X, Loader2, User } from 'lucide-react';

const DriverSelector = ({ onSelect, selectedDriver, placeholder = 'Rechercher un chauffeur...' }) => {
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
        const driversRes = await pb.collection('drivers').getList(1, 10, {
          filter: `organization_id = "${orgId}" && status = "active"`,
          sort: '-created',
          $autoCancel: false,
        });
        const items = driversRes.items || [];
        const memberIds = [...new Set(items.map(d => d.member_id).filter(Boolean))];
        if (memberIds.length > 0) {
          const mFilter = memberIds.map(id => `id = "${id}"`).join(' || ');
          const mRes = await pb.collection('members').getList(1, 10, {
            filter: `(${mFilter}) && (name ~ "${query}" || phone ~ "${query}")`,
            sort: 'name', $autoCancel: false,
          });
          const mMap = {}; (mRes.items || []).forEach(m => { mMap[m.id] = m; });
          setResults(items.filter(d => mMap[d.member_id]).map(d => ({ ...d, _member: mMap[d.member_id] })));
        } else { setResults([]); }
        setOpen(true);
      } catch { setResults([]); } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, orgId]);

  const handleSelect = (d) => { onSelect(d); setQuery(d._member?.name || 'Chauffeur'); setOpen(false); };
  const clearSelection = () => { onSelect(null); setQuery(''); setResults([]); };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={selectedDriver ? (selectedDriver._member?.name || 'Sélectionné') : query}
          onChange={(e) => { setQuery(e.target.value); if (selectedDriver) onSelect(null); }}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={selectedDriver ? '' : placeholder}
          className="w-full bg-background border border-border rounded-xl pl-10 pr-10 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          disabled={!!selectedDriver} />
        {selectedDriver && <button onClick={clearSelection} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>}
        {loading && !selectedDriver && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-modal max-h-60 overflow-y-auto">
          {results.map(d => (
            <button key={d.id} onClick={() => handleSelect(d)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-blue-500" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{d._member?.name || 'Chauffeur inconnu'}</p>
                <p className="text-[10px] text-muted-foreground">{d._member?.phone || ''} {d.license_number && `• ${d.license_number}`}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-modal p-4 text-center">
          <p className="text-sm text-muted-foreground">Aucun chauffeur trouvé</p>
        </div>
      )}
    </div>
  );
};

export default DriverSelector;
