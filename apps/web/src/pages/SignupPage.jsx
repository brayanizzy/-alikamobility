import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import pb from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { ArrowLeft, Loader2, AlertCircle, Building2, MapPin, Phone, User, Mail, Lock, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    contact_phone: '',
    manager_name: '',
    email: '',
    password: '',
    passwordConfirm: ''
  });
  const [logo, setLogo] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.passwordConfirm) {
      return setError('Les mots de passe ne correspondent pas.');
    }

    setIsSubmitting(true);

    try {
      // 1. Create Organization
      const orgData = new FormData();
      orgData.append('name', formData.name);
      orgData.append('city', formData.city);
      orgData.append('contact_phone', formData.contact_phone);
      orgData.append('manager_name', formData.manager_name);
      orgData.append('contact_email', formData.email);
      orgData.append('subscription_plan', 'free');
      if (logo) orgData.append('logo', logo);

      const organization = await pb.collection('organizations').create(orgData, { $autoCancel: false });

      // 2. Create Admin User
      const userData = {
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        name: formData.manager_name,
        role: 'admin',
        organization_id: organization.id,
        phone: formData.contact_phone
      };

      await pb.collection('users').create(userData, { $autoCancel: false });

      // 3. Auto Login
      await login(formData.email, formData.password);
      
      toast.success('Association créée avec succès !');
      navigate('/dashboard', { replace: true });

    } catch (err) {
      console.error(err);
      setError(err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Form Side */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 relative overflow-y-auto">
        <Link 
          to="/login" 
          className="absolute top-8 left-6 sm:left-12 text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la connexion
        </Link>

        <div className="max-w-xl w-full mx-auto mt-12 lg:mt-0">
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-foreground mb-3 tracking-tight">Inscrire votre Association</h1>
            <p className="text-muted-foreground text-lg">
              Créez l'espace de votre association pour commencer à gérer vos parkings et agents.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground tracking-wide">Nom de l'Association *</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text" name="name" value={formData.name} onChange={handleChange} required
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Ex: Association des Motards..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground tracking-wide">Ville *</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text" name="city" value={formData.city} onChange={handleChange} required
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Ex: Kinshasa"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground tracking-wide">Téléphone *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange} required
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="+243..."
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground tracking-wide">Nom du Responsable *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text" name="manager_name" value={formData.manager_name} onChange={handleChange} required
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground tracking-wide">Email (Login) *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email" name="email" value={formData.email} onChange={handleChange} required
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="contact@association.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground tracking-wide">Mot de passe *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password" name="password" value={formData.password} onChange={handleChange} required minLength="8"
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground tracking-wide">Confirmer *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password" name="passwordConfirm" value={formData.passwordConfirm} onChange={handleChange} required minLength="8"
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground tracking-wide">Logo de l'Association (Optionnel)</label>
                <div className="relative flex items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl hover:bg-muted/30 transition-colors cursor-pointer overflow-hidden">
                  <input
                    type="file" accept="image/*" onChange={(e) => setLogo(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {logo ? (
                    <span className="text-sm font-medium text-primary flex items-center gap-2">
                      <UploadCloud className="w-5 h-5" /> {logo.name}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <UploadCloud className="w-5 h-5" /> Cliquez pour télécharger
                    </span>
                  )}
                </div>
              </div>

            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 mt-8 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                'Créer mon Association'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Image Side */}
      <div className="hidden lg:block lg:w-1/2 relative bg-primary">
        <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/20 to-transparent z-10"></div>
        <img
          src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80"
          alt="Modern transportation"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-16 z-20">
          <h2 className="text-4xl font-bold text-white mb-4">Rejoignez Alika Mobility</h2>
          <p className="text-white/80 text-lg max-w-md">
            Gérez votre association de taxi-motos, encaissez numériquement et suivez vos statistiques en temps réel avec notre plateforme SaaS conçue pour le terrain.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
