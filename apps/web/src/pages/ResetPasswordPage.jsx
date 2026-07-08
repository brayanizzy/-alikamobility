import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import client from '@/lib/apiClient';

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [status, setStatus] = useState('checking'); // checking | valid | invalid | expired | used
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    let cancelled = false;
    (async () => {
      try {
        const data = await client.request('/auth/reset-password/verify', { method: 'GET', params: { token } });
        if (cancelled) return;
        if (data.valid) { setStatus('valid'); setEmail(data.email || ''); }
        else { setStatus(data.status || 'invalid'); }
      } catch {
        if (!cancelled) setStatus('invalid');
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const passwordChecks = [
    { label: '10 caractères minimum', ok: password.length >= 10 },
    { label: '1 majuscule', ok: /[A-Z]/.test(password) },
    { label: '1 minuscule', ok: /[a-z]/.test(password) },
    { label: '1 chiffre', ok: /[0-9]/.test(password) },
    { label: '1 caractère spécial', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const allValid = passwordChecks.every((c) => c.ok) && password === confirmation;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!allValid) { setError('Vérifiez que votre mot de passe respecte toutes les règles et que la confirmation correspond.'); return; }
    setIsSubmitting(true);
    try {
      await client.request('/auth/reset-password', { method: 'POST', body: { token, password, password_confirmation: confirmation } });
      setDone(true);
    } catch (err) {
      setError(err?.response?.error || err?.message || 'Erreur lors de la réinitialisation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInvalid = (title, msg) => (
    <div className="text-center">
      <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground mb-6">{msg}</p>
      <Link to="/forgot-password" className="inline-block bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:brightness-110 transition">
        Demander un nouveau lien
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full">
        <Link to="/login" className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour à la connexion
        </Link>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {status === 'checking' && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          {status === 'invalid' && renderInvalid('Lien invalide', 'Ce lien de réinitialisation est invalide. Demandez un nouveau lien.')}
          {status === 'expired' && renderInvalid('Lien expiré', 'Ce lien a expiré. Les liens de réinitialisation sont valables 1 heure.')}
          {status === 'used' && renderInvalid('Lien déjà utilisé', 'Ce lien a déjà été utilisé. Demandez un nouveau lien si nécessaire.')}

          {done && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Mot de passe modifié</h1>
              <p className="text-muted-foreground mb-6">Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.</p>
              <Link to="/login" className="inline-block bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:brightness-110 transition">
                Se connecter
              </Link>
            </div>
          )}

          {status === 'valid' && !done && (
            <>
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                <Lock className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Nouveau mot de passe</h1>
              {email && <p className="text-muted-foreground mb-6 text-sm">Pour <strong className="text-foreground">{email}</strong></p>}

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Nouveau mot de passe</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full h-12 px-4 pr-12 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Confirmer</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    required
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1">
                  {passwordChecks.map((c) => (
                    <div key={c.label} className={`flex items-center gap-2 text-xs ${c.ok ? 'text-primary' : 'text-muted-foreground'}`}>
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${c.ok ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {c.ok && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      {c.label}
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !allValid}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Modifier le mot de passe'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
