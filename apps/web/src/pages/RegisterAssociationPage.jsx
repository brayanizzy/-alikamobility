import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, Building2, User, Lock, CreditCard, Eye, EyeOff } from 'lucide-react';
import client from '@/lib/apiClient';

const ACTIVITY_TYPES = [
  { value: 'taxi-moto', label: 'Taxi-Moto' },
  { value: 'taxi-voiture', label: 'Taxi Voiture' },
  { value: 'bus', label: 'Bus' },
  { value: 'parking', label: 'Parking' },
  { value: 'transport-mixte', label: 'Transport Mixte' },
  { value: 'autre', label: 'Autre' },
];

const PLANS = [
  { code: 'starter', name: 'Starter', desc: 'Petite association — démarrage', icon: '🚀' },
  { code: 'pro', name: 'Pro', desc: 'Association moyenne — croissance', icon: '📈' },
  { code: 'premium', name: 'Premium', desc: 'Grande association — scale', icon: '💎' },
  { code: 'enterprise', name: 'Enterprise', desc: 'Structure personnalisée', icon: '🏢' },
];

const initial = {
  association: { name: '', activity_type: '', province: '', city: '', address: '', phone: '', email: '' },
  manager: { name: '', phone: '', email: '', function: '' },
  account: { email: '', password: '', password_confirmation: '' },
  plan_code: '',
};

const RegisterAssociationPage = () => {
  const [form, setForm] = useState(initial);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const setAssoc = (k, v) => setForm({ ...form, association: { ...form.association, [k]: v } });
  const setMgr = (k, v) => setForm({ ...form, manager: { ...form.manager, [k]: v } });
  const setAcct = (k, v) => setForm({ ...form, account: { ...form.account, [k]: v } });

  const pwdChecks = [
    { label: '10 caractères', ok: form.account.password.length >= 10 },
    { label: '1 majuscule', ok: /[A-Z]/.test(form.account.password) },
    { label: '1 minuscule', ok: /[a-z]/.test(form.account.password) },
    { label: '1 chiffre', ok: /[0-9]/.test(form.account.password) },
    { label: '1 spécial', ok: /[^A-Za-z0-9]/.test(form.account.password) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await client.request('/public/association-registrations', { method: 'POST', body: form });
      setDone(true);
    } catch (err) {
      setError(err?.response?.error || err?.message || 'Erreur lors de l\'envoi de la demande.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Demande envoyée</h1>
          <p className="text-muted-foreground leading-relaxed mb-2">
            Votre demande a été envoyée avec succès.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-2">
            Votre compte est en attente de validation par l'équipe ALIKA MOBILITY.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Vous recevrez une confirmation par email après examen de votre demande.
          </p>
          <Link to="/login" className="inline-block bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:brightness-110 transition">
            Aller à la connexion
          </Link>
        </div>
      </div>
    );
  }

  const inputCls = 'w-full h-11 px-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm';
  const labelCls = 'text-sm font-medium text-foreground block mb-1.5';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link to="/" className="text-primary-foreground/80 hover:text-primary-foreground flex items-center gap-2 text-sm font-medium mb-4">
            <ArrowLeft className="w-4 h-4" /> Accueil
          </Link>
          <h1 className="text-3xl font-bold">Créer mon association</h1>
          <p className="opacity-90 mt-2">Inscrivez votre association de transport sur ALIKA MOBILITY. Votre demande sera examinée par notre équipe.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        )}

        {/* Section 1: Association */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Informations de l'association</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Nom de l'association *</label>
              <input className={inputCls} value={form.association.name} onChange={(e) => setAssoc('name', e.target.value)} required placeholder="Ex: AITAMOV Bunia" />
            </div>
            <div>
              <label className={labelCls}>Type d'activité *</label>
              <select className={inputCls} value={form.association.activity_type} onChange={(e) => setAssoc('activity_type', e.target.value)} required>
                <option value="">Sélectionner...</option>
                {ACTIVITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Province *</label>
              <input className={inputCls} value={form.association.province} onChange={(e) => setAssoc('province', e.target.value)} required placeholder="Ex: Ituri" />
            </div>
            <div>
              <label className={labelCls}>Ville *</label>
              <input className={inputCls} value={form.association.city} onChange={(e) => setAssoc('city', e.target.value)} required placeholder="Ex: Bunia" />
            </div>
            <div>
              <label className={labelCls}>Adresse</label>
              <input className={inputCls} value={form.association.address} onChange={(e) => setAssoc('address', e.target.value)} placeholder="Quartier, commune..." />
            </div>
            <div>
              <label className={labelCls}>Téléphone association</label>
              <input className={inputCls} value={form.association.phone} onChange={(e) => setAssoc('phone', e.target.value)} placeholder="+243..." />
            </div>
            <div>
              <label className={labelCls}>Email association</label>
              <input type="email" className={inputCls} value={form.association.email} onChange={(e) => setAssoc('email', e.target.value)} placeholder="contact@association.com" />
            </div>
          </div>
        </div>

        {/* Section 2: Responsable */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Responsable</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nom complet *</label>
              <input className={inputCls} value={form.manager.name} onChange={(e) => setMgr('name', e.target.value)} required placeholder="Jean Mukendi" />
            </div>
            <div>
              <label className={labelCls}>Téléphone *</label>
              <input className={inputCls} value={form.manager.phone} onChange={(e) => setMgr('phone', e.target.value)} required placeholder="+243..." />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input type="email" className={inputCls} value={form.manager.email} onChange={(e) => setMgr('email', e.target.value)} required placeholder="responsable@example.com" />
            </div>
            <div>
              <label className={labelCls}>Fonction</label>
              <input className={inputCls} value={form.manager.function} onChange={(e) => setMgr('function', e.target.value)} placeholder="Président, Secrétaire..." />
            </div>
          </div>
        </div>

        {/* Section 3: Compte */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Compte de connexion</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Email de connexion *</label>
              <input type="email" className={inputCls} value={form.account.email} onChange={(e) => setAcct('email', e.target.value)} required placeholder="admin@association.com" />
            </div>
            <div>
              <label className={labelCls}>Mot de passe *</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className={inputCls + ' pr-12'} value={form.account.password} onChange={(e) => setAcct('password', e.target.value)} required placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Confirmer *</label>
              <input type={showPassword ? 'text' : 'password'} className={inputCls} value={form.account.password_confirmation} onChange={(e) => setAcct('password_confirmation', e.target.value)} required placeholder="••••••••" />
            </div>
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              {pwdChecks.map((c) => (
                <span key={c.label} className={`text-xs px-2 py-1 rounded-md ${c.ok ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{c.ok ? '✓ ' : ''}{c.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Forfait */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Choix du forfait</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {PLANS.map((p) => (
              <button
                type="button" key={p.code}
                onClick={() => setForm({ ...form, plan_code: p.code })}
                className={`text-left p-4 rounded-xl border-2 transition ${form.plan_code === p.code ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <p className="font-bold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/" className="flex-1 h-12 rounded-xl border border-border text-foreground font-medium flex items-center justify-center hover:bg-muted transition">Annuler</Link>
          <button
            type="submit" disabled={submitting || !form.plan_code}
            className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Envoyer ma demande'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center">En soumettant cette demande, vous acceptez que vos informations soient examinées par l'équipe ALIKA MOBILITY.</p>
      </form>
    </div>
  );
};

export default RegisterAssociationPage;
