import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import LandingNavbar from '@/components/landing/LandingNavbar.jsx';
import LandingFooter from '@/components/landing/LandingFooter.jsx';
import HeroMockup from '@/components/landing/HeroMockup.jsx';
import FeatureCard from '@/components/landing/FeatureCard.jsx';
import RoleCard from '@/components/landing/RoleCard.jsx';
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Users,
  IdCard,
  Car,
  MapPinned,
  Wallet,
  Receipt,
  CreditCard,
  ScanLine,
  WifiOff,
  FileBarChart,
  Bell,
  Activity,
  ShieldCheck,
  Building2,
  UserCog,
  Smartphone,
  Lock,
  Database,
  QrCode,
  UploadCloud,
  Save,
  BarChart3,
  Wifi,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';

const FADE_UP = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5 },
};

const BADGES = ['PWA', 'QR sécurisé', 'Mode offline', 'Rapports', 'Notifications', 'PHP / MySQL'];

const PROBLEMS = [
  {
    icon: XCircle,
    title: 'Paiements difficiles à suivre',
    description: 'Les encaissements sur papier se perdent et laissent place à des erreurs et des désaccords.',
  },
  {
    icon: XCircle,
    title: 'Dettes et pénalités mal contrôlées',
    description: "Sans suivi centralisé, il est difficile de savoir qui doit quoi et depuis quand.",
  },
  {
    icon: XCircle,
    title: 'Données dispersées',
    description: 'Agents, caissiers et responsables travaillent chacun de leur côté, sans vision commune.',
  },
];

const SOLUTIONS = [
  {
    icon: CheckCircle2,
    title: 'Encaissement suivi avec reçus',
    description: 'Chaque paiement génère un reçu numérique traçable, en ligne comme sur le terrain.',
  },
  {
    icon: CheckCircle2,
    title: 'Cartes membres QR sécurisées',
    description: 'Identification rapide et fiable grâce à un QR code protégé par signature HMAC-SHA256.',
  },
  {
    icon: CheckCircle2,
    title: 'Rapports et notifications en temps réel',
    description: 'Chaque responsable voit ce qui se passe et reçoit des alertes utiles au bon moment.',
  },
];

const FEATURES = [
  { icon: Users, title: 'Gestion des membres', description: 'Fiches membres complètes, statuts et historique centralisés.' },
  { icon: IdCard, title: 'Chauffeurs et propriétaires', description: 'Permis, certificats et rattachement aux véhicules.' },
  { icon: Car, title: 'Véhicules et documents', description: 'Suivi des véhicules et de leurs documents avec alertes d’expiration.' },
  { icon: MapPinned, title: 'Parkings, lignes et affectations', description: 'Organisation claire des zones, lignes et affectations de véhicules.' },
  { icon: Wallet, title: 'Paiements, dettes et pénalités', description: 'Suivi précis des encaissements, arriérés et sanctions.' },
  { icon: Receipt, title: 'Reçus et rapports caisse', description: 'Reçus automatiques et rapports de caisse fiables.' },
  { icon: CreditCard, title: 'Cartes membres QR HMAC', description: 'Cartes sécurisées, vérifiables instantanément sur le terrain.' },
  { icon: ScanLine, title: 'Scanner terrain', description: 'Scan rapide des cartes membres pour identifier et encaisser.' },
  { icon: WifiOff, title: 'Mode offline et synchronisation', description: 'Continuez à travailler sans connexion, synchronisez ensuite.' },
  { icon: FileBarChart, title: 'Rapports PDF / Excel', description: 'Exports professionnels prêts à imprimer ou partager.' },
  { icon: Bell, title: 'Notifications Email / SMS / WhatsApp', description: 'Alertes multicanal pour dettes, reçus et documents expirés.' },
  { icon: Activity, title: 'Monitoring et sauvegardes', description: 'Surveillance de la plateforme et sauvegardes régulières.' },
];

const ROLES = [
  {
    icon: ShieldCheck,
    title: 'Super-admin',
    description: 'Pilote toute la plateforme, les organisations, la santé système et les rapports globaux.',
    accent: 'primary',
  },
  {
    icon: UserCog,
    title: 'Responsable association',
    description: 'Gère membres, agents, véhicules, paiements, dettes, rapports et notifications de son organisation.',
    accent: 'secondary',
  },
  {
    icon: Smartphone,
    title: 'Agent terrain',
    description: 'Scanne les cartes QR, encaisse sur terrain et travaille même avec une connexion instable.',
    accent: 'primary',
  },
  {
    icon: Wallet,
    title: 'Caissier',
    description: 'Suit les paiements, reçus, dettes et rapports caisse de façon claire et sécurisée.',
    accent: 'secondary',
  },
];

const STEPS = [
  { icon: Building2, title: 'Créer une organisation', description: 'Enregistrez votre association ou agence de transport.' },
  { icon: Users, title: 'Ajouter membres et véhicules', description: 'Chauffeurs, propriétaires et véhicules en quelques minutes.' },
  { icon: ScanLine, title: 'Encaisser et scanner', description: 'Encaissez sur le terrain et générez des reçus instantanément.' },
  { icon: BarChart3, title: 'Suivre les rapports', description: 'Dettes, notifications et performances en un coup d’œil.' },
];

const SECURITY_POINTS = [
  { icon: Lock, text: 'Authentification sécurisée par sessions' },
  { icon: ShieldCheck, text: 'Permissions contrôlées côté serveur' },
  { icon: Database, text: 'Isolation stricte des données par organisation' },
  { icon: QrCode, text: 'QR code membre signé HMAC-SHA256' },
  { icon: UploadCloud, text: 'Upload de fichiers vérifié et sécurisé' },
  { icon: Bell, text: 'Notifications en mode test contrôlé' },
  { icon: Activity, text: 'Supervision de l’état de la plateforme' },
  { icon: Save, text: 'Sauvegardes régulières de la base de données' },
];

const PLATFORM_STATUS = [
  { label: 'API', value: 'Opérationnelle' },
  { label: 'Base de données', value: 'Connectée' },
  { label: 'Sécurité', value: 'Active' },
];

const REPORT_TYPES = [
  { icon: Wallet, label: 'Paiements' },
  { icon: Receipt, label: 'Dettes' },
  { icon: Users, label: 'Performances agents' },
  { icon: IdCard, label: 'Documents expirés' },
  { icon: FileBarChart, label: 'Rapports caisse' },
  { icon: FileSpreadsheet, label: 'Exports CSV / Excel' },
];

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30">
      <LandingNavbar />

      <main className="flex-1 overflow-x-hidden">
        {/* SECTION 2 — Hero premium */}
        <section className="relative pt-16 pb-20 md:pt-20 md:pb-28 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center lg:text-left"
              >
                <div className="inline-flex items-center px-3 py-1 mb-6 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs sm:text-sm font-semibold tracking-wide">
                  <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
                  Plateforme de gestion transport
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.1] text-balance">
                  La plateforme intelligente pour gérer les{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                    associations de transport
                  </span>
                </h1>

                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed text-balance">
                  ALIKA MOBILITY centralise les membres, chauffeurs, véhicules, paiements, dettes, cartes QR, rapports et notifications dans une seule application simple, sécurisée et installable.
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-9">
                  {BADGES.map((badge) => (
                    <span
                      key={badge}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border/60"
                    >
                      {badge}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link
                    to="/login"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-bold text-base hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    Se connecter <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/register-association"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 font-bold text-base transition-all flex items-center justify-center"
                  >
                    Créer mon association
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="pt-6 lg:pt-0"
              >
                <HeroMockup />
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — Problème / Solution */}
        <motion.section {...FADE_UP} className="py-20 md:py-24 bg-card/50 border-y border-border/50">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
                Fini les cahiers, les pertes et les rapports compliqués
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-destructive mb-5">Les problèmes du terrain</p>
                <div className="space-y-4">
                  {PROBLEMS.map((item) => (
                    <div key={item.title} className="flex gap-3">
                      <item.icon className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground text-sm mb-0.5">{item.title}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-success mb-5">Ce que fait Alika Mobility</p>
                <div className="space-y-4">
                  {SOLUTIONS.map((item) => (
                    <div key={item.title} className="flex gap-3">
                      <item.icon className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground text-sm mb-0.5">{item.title}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* SECTION 4 — Fonctionnalités principales */}
        <motion.section id="fonctionnalites" {...FADE_UP} className="py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
                Tout ce qu’il faut pour gérer une association de transport
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Un ensemble complet d’outils pensés pour le terrain et pour le pilotage.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </motion.section>

        {/* SECTION 5 — Interfaces par rôle */}
        <motion.section id="roles" {...FADE_UP} className="py-20 md:py-24 bg-card/50 border-y border-border/50">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
                Une interface adaptée à chaque rôle
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {ROLES.map((role) => (
                <RoleCard key={role.title} {...role} />
              ))}
            </div>
          </div>
        </motion.section>

        {/* SECTION 6 — Comment ça marche */}
        <motion.section id="comment-ca-marche" {...FADE_UP} className="py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
                Une gestion simple en 4 étapes
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative">
              <div className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-0.5 bg-border" />
              {STEPS.map((step, index) => (
                <div key={step.title} className="relative flex flex-col items-center md:items-center text-center md:text-center">
                  <div className="relative z-10 w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mb-4 shadow-lg shadow-primary/20">
                    {index + 1}
                  </div>
                  <step.icon className="w-5 h-5 text-primary mb-2" />
                  <p className="font-bold text-foreground text-sm mb-1">{step.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* SECTION 7 — Terrain et offline */}
        <motion.section {...FADE_UP} className="py-20 md:py-24 bg-card/50 border-y border-border/50">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
                  Pensé pour les réalités du terrain
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6 text-balance">
                  Même lorsque la connexion est instable, les agents peuvent continuer à travailler et synchroniser les opérations plus tard.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Application installable', 'Mode offline', 'Synchronisation automatique', 'Scanner QR', 'Paiement terrain'].map((tag) => (
                    <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-background border border-border text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-56 rounded-[2rem] border-4 border-foreground/10 bg-background p-3 shadow-elevated">
                  <div className="rounded-2xl bg-muted/50 border border-border overflow-hidden">
                    <div className="h-10 bg-primary flex items-center justify-between px-3">
                      <Smartphone className="w-4 h-4 text-primary-foreground" />
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-primary-foreground/90">
                        <WifiOff className="w-3 h-3" /> Hors ligne
                      </span>
                    </div>
                    <div className="p-3 space-y-2.5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-11 rounded-lg bg-background border border-border flex items-center px-2.5 gap-2">
                          <ScanLine className="w-3.5 h-3.5 text-secondary" />
                          <div className="h-2 w-16 bg-muted rounded-full" />
                          <CheckCircle2 className="w-3.5 h-3.5 text-success ml-auto" />
                        </div>
                      ))}
                      <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-muted-foreground pt-1">
                        <Wifi className="w-3 h-3" /> 3 opérations en attente de sync
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* SECTION 8 — Sécurité et fiabilité */}
        <motion.section id="securite" {...FADE_UP} className="py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
                  Sécurité, contrôle et séparation des données
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  Chaque organisation évolue dans un environnement isolé, avec des permissions strictes et des données protégées.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {SECURITY_POINTS.map((point) => (
                    <div key={point.text} className="flex items-start gap-2.5">
                      <point.icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground leading-relaxed">{point.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-elevated h-fit">
                <p className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-success" /> Statut plateforme
                </p>
                <div className="space-y-3">
                  {PLATFORM_STATUS.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-xl bg-muted/50 border border-border/60 px-4 py-3">
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" /> {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* SECTION 9 — Rapports et pilotage */}
        <motion.section {...FADE_UP} className="py-20 md:py-24 bg-card/50 border-y border-border/50">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
                  Des décisions basées sur des chiffres clairs
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Des rapports lisibles pour suivre l’activité et prendre les bonnes décisions, exportables en un clic.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {REPORT_TYPES.map((report) => (
                    <div key={report.label} className="flex items-center gap-2 rounded-xl bg-background border border-border px-3 py-2.5">
                      <report.icon className="w-4 h-4 text-secondary shrink-0" />
                      <span className="text-sm font-medium text-foreground">{report.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-elevated">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm font-bold text-foreground">Encaissements — 7 derniers jours</p>
                  <span className="flex items-center gap-1 text-xs font-semibold text-success">
                    <TrendingUp className="w-3.5 h-3.5" /> +8%
                  </span>
                </div>
                <div className="flex items-end gap-2.5 h-32">
                  {[40, 65, 50, 80, 60, 95, 72].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary-light"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* SECTION 10 — CTA final */}
        <motion.section {...FADE_UP} className="py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-10 md:p-14 shadow-2xl shadow-primary/20">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4 text-balance">
                Prêt à moderniser votre association de transport ?
              </h2>
              <p className="text-primary-foreground/85 leading-relaxed mb-8 max-w-xl mx-auto text-balance">
                Connectez-vous et commencez à gérer vos membres, paiements, cartes QR et rapports avec une solution professionnelle.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-background text-foreground font-bold text-base hover:brightness-95 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  Se connecter <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/register-association"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/30 hover:bg-primary-foreground/20 font-bold text-base transition-all flex items-center justify-center"
                >
                  Créer mon association
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      {/* SECTION 11 — Footer */}
      <LandingFooter />
    </div>
  );
};

export default HomePage;
