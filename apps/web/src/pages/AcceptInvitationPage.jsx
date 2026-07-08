import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, MailOpen } from 'lucide-react';
import client from '@/lib/apiClient';

const AcceptInvitationPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [status, setStatus] = useState('checking');
  const [info, setInfo] = useState(null);
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
        const data = await client.request('/auth/invitation/verify', { method: 'GET', params: { token } });
        if (cancelled) return;
        if (data.valid) { setInfo(data); setStatus('valid'); }
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
    if (!allValid) { setError('Vérifiez les règles de mot de passe et la confirmation.'); return; }
    setIsSubmitting(true);
    try {
      await client.request('/auth/invitation/accept', { method: 'POST', body: { token, password, password_confirmation: confirmation } });
      setDone(true);
    } catch (err) {
      setError(err?.response?.error || err?.message || 'Erreur lors de l\'activation.');
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
      <Link to="/login" className="inline-block bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:brightness-110 transition">
        Aller à la connexion
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full">
        <Link to="/" className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium mb-8">
          <ArrowLeft className="w-4 h-4" /> Accueil
        </Link>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {status === 'checking' && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          {status === 'invalid' && renderInvalid('Invitation invalide', 'Ce lien d\'invitation est invalide. Contactez votre administrateur.')}
          {status === 'expired' && renderInvalid('Invitation expirée', 'Cette invitation a expiré. Demandez à votre administrateur de renvoyer une invitation.')}
          {status === 'used' && renderInvalid('Invitation déjà utilisée', 'Cette invitation a déjà été utilisée. Votre compte est déjà actif.')}

          {done && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Compte activé</h1>
              <p className="text-muted-foreground mb-6">Votre compte est maintenant actif. Vous pouvez vous connecter avec votre nouveau mot de passe.</p>
              <Link to="/login" className="inline-block bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:brightness-110 transition">
                Se connecter
              </Link>
            </div>
          )}

          {status === 'valid' && !done && info && (
            <>
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                <MailOpen className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Bienvenue sur ALIKA MOBILITY</h1>
              <p className="text-muted-foreground mb-2">Définissez votre mot de passe pour activer votre compte.</p>
              <div className="bg-muted/50 rounded-xl p-3 mb-5 space-y-1 text-sm">
                {info.email && <p className="text-muted-foreground">Email : <strong className="text-foreground">{info.email}</strong></p>}
                {info.role_label && <p className="text-muted-foreground">Rôle : <strong className="text-foreground">{info.role_label}</strong></p>}
                {info.organization && <p className="text-muted-foreground">Organisation : <strong className="text-foreground">{info.organization}</strong></p>}
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Mot de passe</label>
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
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Activer mon compte'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitationPage;
