
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const authData = await login(email, password);
      
      // Determine redirect based on role
      const role = authData.record.role;
      const from = location.state?.from?.pathname;
      
      if (from && from !== '/') {
        navigate(from, { replace: true });
      } else {
        if (role === 'super-admin') navigate('/super-admin', { replace: true });
        else if (role === 'admin') navigate('/dashboard', { replace: true });
        else if (role === 'agent') navigate('/agent', { replace: true });
        else navigate('/', { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Form Side */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative">
        <Link 
          to="/" 
          className="absolute top-8 left-8 sm:left-16 lg:left-24 xl:left-32 text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="max-w-md w-full mx-auto mt-16 lg:mt-0">
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-foreground mb-3 tracking-tight">Welcome Back</h1>
            <p className="text-muted-foreground text-lg">
              Sign in to access the Alika Mobility platform.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground tracking-wide uppercase">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="admin@alika.com"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground tracking-wide uppercase">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center border-t border-border pt-8">
            <p className="text-sm text-muted-foreground">
              Need access? Contact your association administrator.
            </p>
          </div>
        </div>
      </div>

      {/* Right Image Side */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay z-10"></div>
        <img
          src="https://images.unsplash.com/photo-1547817705-54f36887b36a"
          alt="Abstract dark modern structure with golden lighting"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute bottom-16 left-16 right-16 z-20">
          <blockquote className="text-2xl font-medium text-white leading-relaxed text-balance">
            "Alika Mobility has revolutionized how we track payments and manage our parking infrastructure across the entire region."
          </blockquote>
          <div className="mt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary/80 flex items-center justify-center font-bold text-secondary-foreground">A</div>
            <div>
              <p className="font-bold text-white">AITMC Leadership</p>
              <p className="text-white/70 text-sm">Partner since 2025</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
