import React, { useState, useEffect } from 'react';
import client from '@/lib/apiClient';

const STATUS_COLORS = {
  ok: 'text-green-500',
  degraded: 'text-yellow-500',
  error: 'text-red-500',
};

const SystemHealthPage = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.request('/health');
      setHealth(data);
    } catch (err) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Santé du système</h1>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Rafraîchissement...' : 'Rafraîchir'}
          </button>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
            {error}
          </div>
        )}

        {loading && !health && (
          <div className="p-8 text-center text-muted-foreground">
            Vérification de l'état du système...
          </div>
        )}

        {health && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border bg-card">
              <h2 className="font-semibold mb-3">Statut général</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <p className={`text-lg font-bold ${STATUS_COLORS[health.status] || 'text-foreground'}`}>
                    {health.status === 'ok' ? 'Opérationnel' : health.status === 'degraded' ? 'Dégradé' : 'Erreur'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Base de données</p>
                  <p className={`text-lg font-bold ${STATUS_COLORS[health.database] || 'text-foreground'}`}>
                    {health.database === 'ok' ? 'Connectée' : health.database === 'error' ? 'Erreur' : 'Injoignable'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Application</p>
                  <p className="text-lg font-bold">{health.app}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Version</p>
                  <p className="text-lg font-bold">{health.version}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Environnement</p>
                  <p className="text-lg font-bold">{health.environment}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Heure serveur</p>
                  <p className="text-lg font-mono text-sm">{health.time}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <h2 className="font-semibold mb-2">Diagnostic</h2>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className={health.status === 'ok' ? 'text-green-500' : 'text-red-500'}>
                    {health.status === 'ok' ? '✓' : '✗'}
                  </span>
                  API accessible
                </li>
                <li className="flex items-center gap-2">
                  <span className={health.database === 'ok' ? 'text-green-500' : 'text-red-500'}>
                    {health.database === 'ok' ? '✓' : '✗'}
                  </span>
                  Base de données {health.database === 'ok' ? 'connectée' : 'indisponible'}
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <span>−</span>
                  Dernière vérification : {new Date().toLocaleTimeString()}
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemHealthPage;
