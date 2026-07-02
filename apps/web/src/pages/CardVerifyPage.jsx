import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import CardVerificationResult from '@/components/cards/CardVerificationResult.jsx';
import { Shield, Search } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://alikamobility.alika-konnect.com/api';

const CardVerifyPage = () => {
  const { cardNumber: paramCardNumber } = useParams();
  const [searchParams] = useSearchParams();
  const initialCard = paramCardNumber || searchParams.get('card') || '';
  const [cardInput, setCardInput] = useState(initialCard);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialCard) {
      verifyCard(initialCard);
    }
  }, [initialCard]);

  const verifyCard = async (cardNumber) => {
    if (!cardNumber || cardNumber.trim().length < 3) {
      setError('Veuillez entrer un numéro de carte valide.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/cards/verify?card_number=${encodeURIComponent(cardNumber.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Carte introuvable ou invalide.');
      }

      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erreur de vérification. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    verifyCard(cardInput);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 flex-1">
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Vérification de Carte</h1>
            <p className="text-sm text-muted-foreground mt-2">Alika Mobility — Association de Transport</p>
          </div>

          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={cardInput}
                onChange={e => setCardInput(e.target.value)}
                placeholder="Entrez le numéro de carte (ex: CARD-GOM-000001)"
                className="flex-1 p-3.5 rounded-xl bg-card border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-6 shadow-card"
          >
            <CardVerificationResult result={result} loading={loading} error={error} />
          </motion.div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Cette vérification est fournie par Alika Mobility.<br />
            En cas de problème, contactez votre association.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CardVerifyPage;
