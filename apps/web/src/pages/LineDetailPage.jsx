import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import Header from '@/components/Header.jsx';
import AppSidebar from '@/components/AppSidebar.jsx';
import StatusBadge from '@/components/StatusBadge.jsx';
import {
  Route, Loader2, AlertCircle, ArrowLeft, Edit,
  MapPin, Ruler, DollarSign, FileText
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency.js';

const LineDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [line, setLine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const l = await pb.collection('lines').getOne(id, { $autoCancel: false });
        setLine(l);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les détails de la ligne.');
      } finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
        <Header /><div className="flex-1 flex"><AppSidebar /><main className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></main></div>
      </div>
    );
  }

  if (error || !line) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
        <Header /><div className="flex-1 flex"><AppSidebar /><main className="flex-1 flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-bold">{error || 'Ligne introuvable.'}</p>
          <button onClick={() => navigate('/lines')} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">Retour</button>
        </main></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 lg:pb-0">
      <Header />
      <div className="flex-1 flex">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => navigate('/lines')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Retour à la liste
              </button>
              <Link to={`/lines/${line.id}/edit`}
                className="flex items-center gap-2 bg-primary/10 text-primary font-bold px-4 py-2 rounded-xl hover:bg-primary/20 transition-all text-sm">
                <Edit className="w-4 h-4" /> Modifier
              </Link>
            </div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 shadow-card">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <Route className="w-8 h-8 text-amber-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-foreground">{line.name}</h1>
                    <StatusBadge status={line.status} />
                  </div>
                  {line.departure && line.arrival && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                      <MapPin className="w-3 h-3" /> {line.departure} → {line.arrival}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {line.distance_km && (
                  <div className="bg-muted/30 rounded-xl p-4 text-center">
                    <Ruler className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Distance</p>
                    <p className="text-lg font-bold text-foreground">{line.distance_km} km</p>
                  </div>
                )}
                {line.base_fare && (
                  <div className="bg-muted/30 rounded-xl p-4 text-center">
                    <DollarSign className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Tarif de Base</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(line.base_fare)}</p>
                  </div>
                )}
                {!line.distance_km && !line.base_fare && (
                  <div className="bg-muted/30 rounded-xl p-4 text-center col-span-full">
                    <FileText className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Aucune information supplémentaire</p>
                  </div>
                )}
              </div>

              {line.notes && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</h3>
                  <p className="text-sm text-foreground">{line.notes}</p>
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LineDetailPage;
