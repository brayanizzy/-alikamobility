import {
  LayoutDashboard, Building2, Users, CreditCard, MapPin, ScanLine,
  BarChart3, Bell, Settings, Truck, UserCircle, Car, LineChart,
  Route, ClipboardCheck, FileText, DollarSign, BookOpen, QrCode,
  Shield, HardDrive, Smartphone, UserCog, Activity, Clock
} from 'lucide-react';

export const NAV_ITEMS = {
  'super-admin': [
    { label: 'Tableau de bord', path: '/super-admin', icon: LayoutDashboard },
    { label: 'Organisations', path: '/super-admin', icon: Building2 },
    { label: 'Utilisateurs', path: '/super-admin', icon: Users },
    { label: 'Types de véhicules', path: '/coming-soon/vehicle-types', icon: Car },
    { label: 'Activité système', path: '/coming-soon/system-activity', icon: Activity },
    { label: 'Notifications', path: '/notifications', icon: Bell },
  ],
  admin: {
    main: [
      { label: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Membres', path: '/members', icon: Users },
      { label: 'Paiements', path: '/payment-history', icon: DollarSign },
      { label: 'Parkings', path: '/parkings', icon: MapPin },
      { label: 'Agents', path: '/agents', icon: UserCog },
      { label: 'Rapports', path: '/reports', icon: BarChart3 },
      { label: 'Notifications', path: '/notifications', icon: Bell },
    ],
    transport: [
      { label: 'Chauffeurs', path: '/drivers', icon: UserCircle },
      { label: 'Propriétaires', path: '/owners', icon: UserCircle },
      { label: 'Véhicules', path: '/coming-soon/vehicles', icon: Car },
      { label: 'Lignes', path: '/coming-soon/lines', icon: Route },
      { label: 'Affectations', path: '/coming-soon/assignments', icon: ClipboardCheck },
    ],
    finances: [
      { label: 'Dettes', path: '/coming-soon/debts', icon: BookOpen },
      { label: 'Documents', path: '/coming-soon/documents', icon: FileText },
      { label: 'Cartes membres', path: '/coming-soon/member-cards', icon: CreditCard },
    ],
  },
  agent: {
    field_collector: [
      { label: 'Accueil', path: '/agent', icon: LayoutDashboard },
      { label: 'Scanner QR', path: '/scanner', icon: ScanLine },
      { label: 'Historique', path: '/payment-history', icon: CreditCard },
      { label: 'Membres', path: '/members-list', icon: Users },
      { label: 'Notifications', path: '/notifications', icon: Bell },
    ],
    office_collector: [
      { label: 'Accueil', path: '/agent', icon: LayoutDashboard },
      { label: 'Paiements', path: '/payment-history', icon: CreditCard },
      { label: 'Membres', path: '/members', icon: Users },
      { label: 'Dettes', path: '/coming-soon/debts', icon: BookOpen },
      { label: 'Notifications', path: '/notifications', icon: Bell },
    ],
  },
};

export const QUICK_ACTIONS = {
  admin: [
    { label: 'Ajouter membre', path: '/members', icon: Users, action: 'add' },
    { label: 'Voir membres', path: '/members', icon: Users },
    { label: 'Parkings', path: '/parkings', icon: MapPin },
    { label: 'Rapports', path: '/reports', icon: BarChart3 },
    { label: 'Scanner QR', path: '/scanner', icon: ScanLine, agentOnly: true },
    { label: 'Chauffeurs', path: '/drivers', icon: UserCircle },
    { label: 'Véhicules', path: '/coming-soon/vehicles', icon: Car, comingSoon: true },
  ],
  agent: [
    { label: 'Scanner QR', path: '/scanner', icon: ScanLine },
    { label: 'Historique paiements', path: '/payment-history', icon: CreditCard },
    { label: 'Mes membres', path: '/members-list', icon: Users },
    { label: 'Notifications', path: '/notifications', icon: Bell },
  ],
  office_collector: [
    { label: 'Paiements', path: '/payment-history', icon: CreditCard },
    { label: 'Membres', path: '/members', icon: Users },
    { label: 'Dettes', path: '/coming-soon/debts', icon: BookOpen, comingSoon: true },
    { label: 'Notifications', path: '/notifications', icon: Bell },
  ],
};

export const PROFILE_LINKS = {
  agent: [
    { label: 'Mon profil', path: '/profile', icon: UserCircle },
    { label: 'Paiements en retard', path: '/late-payments', icon: Clock },
  ],
};

export const MODULE_LABELS = {
  drivers: 'Chauffeurs',
  owners: 'Propriétaires',
  vehicles: 'Véhicules',
  lines: 'Lignes',
  assignments: 'Affectations',
  debts: 'Dettes',
  documents: 'Documents',
  'member-cards': 'Cartes membres',
  'vehicle-types': 'Types de véhicules',
  'system-activity': 'Activité système',
  'manual-payment': 'Paiement manuel',
  sync: 'Synchronisation',
  settings: 'Paramètres',
};
