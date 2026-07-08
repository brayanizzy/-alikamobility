import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { ArrowLeft, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'super-admin') navigate('/super-admin', { replace: true });
      else if (currentUser.role === 'admin') navigate('/dashboard', { replace: true });
      else if (currentUser.role === 'agent') navigate('/agent', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const authData = await login(email, password);
      const role = authData.record.role;
      const from = location.state?.from?.pathname;

      if (from && from !== '/' && from !== '/login' && from !== '/signup') {
        navigate(from, { replace: true });
      } else {
        if (role === 'super-admin') navigate('/super-admin', { replace: true });
        else if (role === 'admin') navigate('/dashboard', { replace: true });
        else if (role === 'agent') navigate('/agent', { replace: true });
        else navigate('/', { replace: true });
      }
    } catch (err) {
      console.error(err);
      const status = err?.status || err?.response?.status;
      const message = err?.message || '';

      if (status === 400 || /authenticate|auth/i.test(message)) {
        setError('Email ou mot de passe incorrect. Vérifiez les identifiants puis réessayez.');
      } else if (!navigator.onLine) {
        setError('Connexion internet indisponible. Réessayez dès que le réseau revient.');
      } else {
        setError('Connexion impossible pour le moment. Vérifiez votre réseau puis réessayez.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative">
        <Link
          to="/"
          className="absolute top-8 left-8 sm:left-16 lg:left-24 xl:left-32 text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>

        <div className="max-w-md w-full mx-auto mt-16 lg:mt-0">
          <div className="mb-10">
            <img src="/assets/images/logo.png" alt="Alika Mobility" className="h-14 w-auto mb-5 rounded-xl border border-border/30 shadow-md" />
            <h1 className="text-4xl font-extrabold text-foreground mb-3 tracking-tight leading-[1.1]">Bon retour parmi nous</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Connectez-vous à votre espace Alika Mobility<br />
              pour gérer votre association de transport.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground tracking-wide uppercase">Adresse Email</label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="votre@association.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-foreground tracking-wide uppercase">Mot de passe</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">Mot de passe oublié ?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-12 px-4 pr-12 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                'Se Connecter'
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground text-center leading-relaxed">
            Nouvelle association ?{' '}
            <Link to="/signup" className="text-primary font-bold hover:underline">Inscrire mon association</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="/assets/images/taxi qui montre un telephone.png"
          alt="Agent Alika Mobility"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <div className="absolute bottom-16 left-16 right-16 z-20">
          <blockquote className="text-2xl font-semibold text-white leading-relaxed text-balance">
            "La gestion des recettes devenue simple et transparente — directement sur le terrain."
          </blockquote>
          <div className="mt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/30 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <span className="text-white font-bold text-sm">AK</span>
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Alika Mobility</p>
              <p className="text-white/60 text-xs">Gestion de transport — RDC</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
