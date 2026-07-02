# ALIKA MOBILITY — MÉMOIRE PERSISTANTE

> Ce fichier est lu à chaque début de session. Il contient tout le contexte du projet,
> l'état d'avancement, les décisions et le journal des sessions.

---

## 1. Contexte Projet

**Alika Mobility** — SaaS de gestion pour associations de transport (taxi-moto) en RDC.
Gère : membres, encaissements par QR code, rapports, mode offline-first.

**Stack actuelle** (production) :
- **Frontend** : React 18 + Vite 7 + Tailwind CSS + shadcn/ui (PWA)
- **Backend** : PHP REST API (`apps/api/`) → **MySQL** sur Hostinger
- **URL** : https://alikamobility.alika-konnect.com
- **API** : https://alikamobility.alika-konnect.com/api

**Migration terminée** : PocketBase → MySQL/PHP.

---

## 2. Architecture Technique

```
ALIKA MOBILITY/
├── apps/
│   ├── api/                  # ✅ Backend MySQL/PHP (production — Hostinger)
│   │   ├── config.php        # Connexion PDO + fonctions utilitaires
│   │   ├── auth.php          # Login/logout/me/validate + rate limiting
│   │   ├── crud.php          # CRUD générique (21 collections V2)
│   │   ├── router.php        # Routage REST
│   │   ├── files.php         # Upload/download fichiers
│   │   └── .htaccess         # Rewrite → router.php
│   └── web/                  # Frontend React + Vite
│       ├── src/
│       │   ├── lib/
│       │   │   ├── apiClient.js         # ✅ Client API custom
│       │   │   └── pocketbaseClient.js  # ✅ Re-export (shim de compat)
│       │   ├── contexts/
│       │   │   └── AuthContext.jsx       # Auth via apiClient
│       │   ├── components/
│       │   │   ├── people/              # Module 3 — composants transport
│       │   │   │   ├── MemberSelector.jsx
│       │   │   │   └── PersonRoleBadge.jsx
│       │   │   ├── dashboard/           # Module 2 — composants dashboard
│       │   │   │   ├── StatCard.jsx
│       │   │   │   ├── QuickActionCard.jsx
│       │   │   │   ├── RecentActivityList.jsx
│       │   │   │   ├── AlertPanel.jsx
│       │   │   │   └── DashboardSection.jsx
│       │   │   ├── ErrorBoundary.jsx     # ✅ Nouveau (anti écran blanc)
│       │   │   ├── PaginationControls.jsx
│       │   │   └── ...
│       │   ├── pages/                   # ~24 pages lazy-loaded
│       │   └── utils/
│       │       ├── OfflineService.js    # Offline-first IndexedDB
│       │       └── ...
│       └── dist/                        # Build de production
├── deploy-sftp.mjs                      # 🚀 Déploiement vers Hostinger
├── deploy-optimized.mjs                 # 🚀 Variante optimisée
├── deploy-full.mjs                      # 🚀 Frontend + Backend
├── .env.deploy.example                  # 📋 Template vars d'env
├── .gitignore                           # ✅ node_modules + .env + dist
└── AGENTS.md                            # ✅ CE FICHIER
```

### Tables MySQL (10)
`organizations`, `users`, `members`, `payments`, `parkings`, `qrcodes`, `receipts`, `notifications`, `admin_audit_logs`, `sessions`

### Rôles
- `super-admin` → SuperAdminDashboard (`/super-admin`)
- `admin` → AdminAssociationDashboard (`/dashboard`)
- `agent` → AgentDashboard (`/agent`) — sous-types : `field_collector`, `office_collector`

---

## 3. Décisions & Conventions

| Sujet | Décision |
|-------|----------|
| **API Client** | `apiClient.js` — pas de SDK npm PocketBase. Import : `import client from '@/lib/apiClient'` |
| **Auth** | Sessions en DB MySQL table `sessions`. Token hex (bearer). Validation via `getAuthUser()` |
| **DB** | Toutes les tables : `id` (PK 15 chars), `created`, `updated`. Fichiers : `/api/files/{collection}/{id}/{filename}` |
| **Environnement** | Config MySQL via `getenv()` dans config.php (fallback valeurs actuelles) |
| **Déploiement** | SFTP via `deploy-sftp.mjs` ou `deploy-optimized.mjs` — credentials via vars d'env |
| **Sécurité** | Rate limiting login (5 tentatives/5min). Error messages génériques. Mot de passe côté serveur |

---

## 4. Commandes Utiles

```bash
cd apps/web && npm run dev              # Dev server (port 3000)
cd apps/web && npm run build            # Production build
npm run build                           # Build depuis la racine

# Déploiement
SFTP_PASS="..." node deploy-sftp.mjs    # Déploiement vers Hostinger
SFTP_PASS="..." node deploy-optimized.mjs
```

---

## 5. Prochaines Étapes (Roadmap)

### 🔴 Urgent (prochaine session)
1. Ajouter tests unitaires (Vitest) pour les pages Module 3 et Module 4

### 🟠 Haute priorité
2. **Module 5 — Lignes/Affectations** : associer chauffeurs/véhicules aux parkings
   - Pages liste/création/détail pour lignes
   - Pages liste/création/détail pour affectations
   - Lier chauffeurs, véhicules, parkings
3. Valider les permissions agents (lecture seule chauffeurs/propriétaires/véhicules/documents)

### 🟡 Moyen terme
4. Module 6 — Dettes/Pénalités
5. Module 7 — Paiements avancés (cartes membres QR)
6. Module 8 — Offline avancé
7. Module 9 — Rapports PDF/Excel avancés
8. Remplacer QR hash faible par HMAC-SHA256
9. Déduplication paiement côté serveur (client_payment_id)
10. Error tracking + monitoring
11. CI/CD pipeline (GitHub Actions)
12. Nettoyer bundle : unused Radix UI, dépendances mortes

### 🟡 Moyen terme
6. Remplacer QR hash faible par HMAC-SHA256
7. Déduplication paiement côté serveur (client_payment_id)
8. Error tracking + monitoring
9. CI/CD pipeline (GitHub Actions)
10. Nettoyer bundle : unused Radix UI, dépendances mortes

---

## 6. Session Log

### Session 1 — 01/07/2026
- Diagnostic complet du projet (36 points d'amélioration identifiés)
- Création de ce fichier `AGENTS.md` comme mémoire persistante
- Correction de l'import cassé : création de `pocketbaseClient.js` (shim)
- Build vérifié : `npm run build` ✅ (2855 modules, 0 erreur)

**Fichiers créés :**
- `apps/web/src/lib/pocketbaseClient.js` — re-export d'apiClient

### Session 2 — 01/07/2026 (Production readiness)
- Sécurisation `config.php` : `display_errors=0`, getenv() pour credentials
- Correction `router.php` : messages d'erreur génériques (plus de fuite)
- Ajout rate limiting sur login (5 tentatives/5 min par IP)
- Ajout `ErrorBoundary.jsx` React + intégration dans `App.jsx`
- Nettoyage :
  - ✅ Dépendance npm `pocketbase` supprimée
  - ✅ Dépendance `react-helmet` supprimée (inutilisée)
  - ✅ Build script nettoyé (`generate-llms.js` inexistant retiré)
  - ✅ Scripts PikaPods supprimés (21 fichiers)
  - ✅ `tmp-pikapod-debug/`, `backup_problematic/` supprimés
  - ✅ `deploy-frontend.mjs` supprimé (paths incorrects)
  - ✅ `dist/apps/` vidé, `.gitignore` enrichi
- Création `.env.deploy.example` pour les credentials
- Sécurisation `deploy-sftp.mjs` et `deploy-optimized.mjs` (getenv)
- Build vérifié : `npm run build` ✅ (27.94s)

### Session 3 — 01/07/2026 (Migration hooks → PHP + nettoyage final)

### Session 4 — 01/07/2026 (Thème clair/sombre + déploiement SSH)
- **Redéfinition des thèmes** : `:root` = mode clair, `.dark` = mode sombre (inversion du précédent comportement où `:root` = dark)
- **next-themes** : installation, `ThemeProvider` dans `main.jsx`, attribut `class`, `defaultTheme="dark"` pour compat ascendante
- **Toggle thème** : icône Soleil/Lune dans `Header.jsx` (navbar + menu mobile)
- **Déploiement SSH** : les scripts `deploy-sftp.mjs` et `deploy-optimized.mjs` supportent désormais l'auth par clé SSH via `SFTP_KEY_PATH`
- Clé utilisée pour Hostinger : `~/.ssh/hostinger_new`
- Build vérifié : `npm run build` ✅ (33.19s)
- Déploiement réussi vers Hostinger ✅

**Fichiers modifiés :**
- `apps/web/src/index.css` — variables CSS :root (clair) + .dark (sombre)
- `apps/web/src/main.jsx` — ajout ThemeProvider
- `apps/web/src/components/Header.jsx` — toggle thème + Sun/Moon icons
- `deploy-sftp.mjs` — support clé SSH
- `deploy-optimized.mjs` — support clé SSH
- `.env.deploy.example` — ajout `SFTP_KEY_PATH`
- `AGENTS.md` — mise à jour session log
- **Migration hooks PocketBase → PHP :**
  - `brevo-mailer.pb.js` → `apps/api/email.php` (cURL direct, sans SDK)
  - `notifications.pb.js` → `apps/api/notifications.php` (création notifications + cron)
  - Intégration des triggers dans `crud.php` (afterCreate members/payments)
  - Router : ajout route `GET /cron/daily-collection-check`
- **Suppression complète PocketBase :**
  - ✅ `apps/pocketbase/` supprimé (binaire, hooks, migrations, data, backup)
  - ✅ `app/pocketbase/` supprimé
  - ✅ `php-email-service/` supprimé (remplacé par email.php)
  - ✅ Root `package.json` nettoyé (plus de ref à pocketbase)
- **Index MySQL** : `apps/api/migrations.sql` (29 indexes sur 10 tables)
- **Correction OfflineService.js** : import → `apiClient` au lieu de `pocketbaseClient`
- Build vérifié : `npm run build` ✅

### Session 5 — 01/07/2026 (Bugfix : validation token + race condition + Promise.all)
- **Bug 1** : `_validateOnLoad()` envoyait un GET sur `/auth/validate` mais la route PHP attend POST → 404 → `authStore.clear()` → session perdue au refresh
- **Bug 2** (race condition) : `checkAuth` dans AuthContext validait l'utilisateur AVANT que `_validateOnLoad` finisse → ProtectedRoute laissait passer avec des données périmées → `fetchMembers` échouait avec "Chargement impossible"
- **Corrections** :
  - `apps/web/src/lib/apiClient.js` : GET → POST sur `/auth/validate` + ajout de `this.ready` (promesse) pour `checkAuth`
  - `apps/web/src/contexts/AuthContext.jsx` : `await pb.ready` avant de décider l'état auth
- Build vérifié : `npm run build` ✅ (27.56s)
- Déploiement vers Hostinger ✅ (2e déploiement)

**Fichiers modifiés :**
- `apps/web/src/lib/apiClient.js` — GET → POST + getter `ready` pour validation bloquante
- `apps/web/src/contexts/AuthContext.jsx` — `await pb.ready` avant set auth state
- `apps/web/src/pages/MembersPage.jsx` — `.catch(() => null)` sur `organizations.getOne` (évite que Promise.all casse si l'org n'existe pas)
- `apps/web/src/pages/ReportsPage.jsx` — idem
- `apps/web/public/sw.js` — version cache bump v1.0.0 → v1.0.1 (forcer mise à jour SW)

### Session 7 — 02/07/2026 (Module 0.2 — Pagination réelle + stabilité)
- **Correction debts** : messages personnalisés (`Le montant initial est requis.`, `Le montant restant est requis.`, `Le montant doit être numérique et positif.`)
- **API pagination** : `perPage` plafonné à 500 (au lieu de 9999) dans `crud.php`
- **apiClient.js** : `getList()` cap à 500, `getFullList()` rétrogradé à 500, ajout de `getAllPaginated()` pour les cas extrêmes
- **Création de `PaginationControls.jsx`** : composant réutilisable (page actuelle, total, boutons Prev/Next)
- **Pages modifiées avec pagination** :
  - `MembersPage.jsx` : pagination complète (Prec/ Suiv), compteur totalItems
  - `PaymentHistoryPage.jsx` : passage de getFullList → getList paginé
  - `AdminAssociationDashboard.jsx` : payments filtrés sur 7 jours, members limités à 500
  - `ReportsPage.jsx` : suppression appel `allPayments` inutile, optimisation PDF export
  - `SuperAdminDashboard.jsx` : payments filtrés sur le mois en cours
  - `AgentDashboard.jsx` : getFullList → getList paginé
  - `LatePaymentsPage.jsx` : payments paginés (todayPayments + 30 jours)
  - `AgentProfilePage.jsx` : payments filtrés sur 7 jours
- **Tests** :
  - PHP lint : 4/4 fichiers OK ✅
  - `npm run build` : 2857 modules, 0 erreur ✅
  - API en ligne : réponse 401 (auth requise) confirmée ✅
  - Frontend en ligne : HTML sert correctement ✅
- **Déploiement** : Hostinger via `deploy-full.mjs` (frontend + backend API) ✅
- **Fichiers créés** : `apps/web/src/components/PaginationControls.jsx`, `deploy-full.mjs`
- **Fichiers modifiés** : `apps/api/crud.php`, `apps/web/src/lib/apiClient.js`, `apps/web/src/pages/MembersPage.jsx`, `apps/web/src/pages/PaymentHistoryPage.jsx`, `apps/web/src/pages/AdminAssociationDashboard.jsx`, `apps/web/src/pages/ReportsPage.jsx`, `apps/web/src/pages/SuperAdminDashboard.jsx`, `apps/web/src/pages/AgentDashboard.jsx`, `apps/web/src/pages/LatePaymentsPage.jsx`, `apps/web/src/pages/AgentProfilePage.jsx`, `AGENTS.md`

### Session 6 — 02/07/2026 (Module 0.1 — Fondations Backend V1)
- **Migration V2** : 11 nouvelles tables créées sur Hostinger (`agencies`, `vehicle_types`, `vehicles`, `drivers`, `owners`, `lines`, `vehicle_assignments`, `documents`, `debts`, `penalties`, `member_cards`)
- **Sauvegarde MySQL** : `backup-alika-before-v2-20260702.sql` sur le serveur Hostinger (27KB, 10 tables)
- **CRUD étendu** : whitelist passée de 10 à 21 collections dans `crud.php`
- **Validations** : champs requis, statuts autorisés, montants numériques pour chaque nouvelle collection
- **Permissions** : matrice de rôles (super-admin, admin, agent, field_collector, office_collector) avec `checkCollectionPermission()`
- **Uploads sécurisés** : validation MIME (finfo), taille max 5MB, extension whitelist (jpg/png/webp/pdf), rejet double extension dangereuse
- **CORS restrictif** : `getAllowedOrigin()` lit `ALLOWED_ORIGINS` depuis l'env (production + localhost), `Vary: Origin`, `Credentials: true`
- **6 types de véhicules** pré-remplis : Taxi-Moto, Taxi, Bus, Camion, Tricycle, Minibus
- Build vérifié : `npm run build` ✅ (2856 modules, 0 erreur)
- Tests API : 21/21 collections OK + CRUD validation OK + permissions OK
- Déploiement Hostinger ✅ (backend + frontend + .env.local)

**Fichiers créés :**
- `apps/api/migrations-v2-transport-core.sql` — migration 11 tables V1

**Fichiers modifiés :**
- `apps/api/crud.php` — whitelist + validations + permissions
- `apps/api/router.php` — CORS restrictif (getAllowedOrigin)
- `apps/api/config.php` — getAllowedOrigin() helper
- `apps/api/files.php` — validation upload MIME/taille/extension

**Module 0.2 terminé** : ✅ Pagination API, frontend paginé, stabilité
**Points restants :**
2. Pages frontend V1 (Agencies, Vehicles, Drivers, etc.)
3. Dashboards par rôle

### Session 8 — 02/07/2026 (Module 1 — UX/Navigation terrain — déploiement production)

- **Intégration réelle** des composants de navigation dans les pages clés :
  - `App.jsx` : `MobileBottomNav` global via `AppContent`, visible sur toutes les pages authentifiées
  - `MembersPage.jsx`, `ParkingsPage.jsx` : ajout `AppSidebar` + `pb-16`
  - `ReportsPage.jsx`, `AdminAssociationDashboard.jsx` : sidebar inline → `AppSidebar` unifié + `pb-16`
  - `ScannerPage.jsx`, `NotificationsPage.jsx`, `AgentDashboard.jsx` : `pb-16`
  - `SuperAdminDashboard.jsx`, `LatePaymentsPage.jsx`, `PaymentHistoryPage.jsx`, `AgentProfilePage.jsx` : `pb-16`
- **Nettoyage** : imports inutilisés supprimés (`Link`, `UserPlus`, `BarChart3`) dans ReportsPage et AdminAssociationDashboard
- **Build** : 2863 modules, 0 erreurs ✅
- **Déploiement** : Hostinger via `deploy-full.mjs` + clé SSH `hostinger_new` ✅
- **Tests production** : frontend SPA actif, PWA manifest + SW v1.0.1, API répond (401/403), assets chargés ✅
- **Fichiers modifiés** (12) : `App.jsx`, `MembersPage.jsx`, `ParkingsPage.jsx`, `ReportsPage.jsx`, `AdminAssociationDashboard.jsx`, `NotificationsPage.jsx`, `ScannerPage.jsx`, `AgentDashboard.jsx`, `SuperAdminDashboard.jsx`, `LatePaymentsPage.jsx`, `PaymentHistoryPage.jsx`, `AgentProfilePage.jsx`

### Session 9 — 02/07/2026 (Module 2 — Dashboards professionnels par rôle)

- **Nouveaux composants réutilisables** (5) :
  - `StatCard.jsx` — carte KPI avec icône, valeur, tendance, état loading
  - `QuickActionCard.jsx` — carte action avec badge "Bientôt"
  - `RecentActivityList.jsx` — liste générique d'activité récente
  - `AlertPanel.jsx` — panneau d'alertes avec sévérité
  - `DashboardSection.jsx` — wrapper de section avec animations
- **SuperAdminDashboard** : vision SaaS globale — 8 KPIs (orgs par statut, utilisateurs, admins), alertes orgs en attente/suspendues, organisations récentes, actions rapides
- **AdminAssociationDashboard** : ajout KPIs transport V1 (véhicules, chauffeurs, dettes, parkings, agents), panneau d'alertes (arriérés, notifications), grille d'actions rapides 6 liens avec "Bientôt"
- **AgentDashboard** : distinction `field_collector` vs `office_collector` — caissier voit cash/mobile split + reçus/dettes, badge notifications non lues, indicateur synchronisation
- **Performance** : `getList(1,500)` max, `.catch()` sur collections V2 potentiellement vides, `Promise.all` parallélisé, `maxItems=5/6` sur listes récentes
- **Build** : 2868 modules, 0 erreurs ✅
- **Commit** : `033f40d` — "Module 2 role-based professional dashboards" (+914/-416)
- **Déploiement** : Hostinger via `deploy-full.mjs` + clé SSH `hostinger_new` ✅
- **Tests production** : frontend SPA, API 401, PWA manifest, assets chargés ✅

### Session 10 — 02/07/2026 (Module 3 — Drivers/Owners People Management)

- **Nouveaux composants réutilisables** (2) :
  - `MemberSelector.jsx` — sélecteur membre avec recherche 300ms debounce, pagination 10
  - `PersonRoleBadge.jsx` — badge Chauffeur/Propriétaire/Membre avec couleurs
- **Pages chauffeurs** :
  - `DriversPage.jsx` — liste + recherche + filtre statut + pagination (15/page) + chargement membres en rafale `id IN (...)`
  - `DriverCreatePage.jsx` — sélection membre lié, permis (numéro/catégorie/expiration), certificat médical, statut, notes
  - `DriverDetailPage.jsx` — profil + infos permis/certificat avec badges expiration (orange ≤30j, rouge expiré) + paiements récents + infos membre lié
  - `DriverEditPage.jsx` — modification complète avec validation
- **Pages propriétaires** :
  - `OwnersPage.jsx` — liste + recherche par nom/téléphone + pagination + badge rôle
  - `OwnerCreatePage.jsx` — sélection membre + détection doublon (vérifie existence)
  - `OwnerDetailPage.jsx` — profil membre + infos + message "Module Véhicules à venir" (Module 4)
- **Navigation** : sidebar admin changée → Chauffeurs `/drivers`, Propriétaires `/owners` (plus ComingSoon)
- **MembersPage** : badges "Chauffeur"/"Propriétaire" sous chaque nom + filtres rôles transport (Tous/Chauffeurs/Propriétaires) — chargement en rafale unique (drivers+owners fetch en parallèle des members)
- **Routes** : 8 nouvelles routes protégées dans App.jsx (`/drivers`, `/drivers/new`, `/drivers/:id`, `/drivers/:id/edit`, `/owners`, `/owners/new`, `/owners/:id`)
- **Build** : 2878 modules, 0 erreurs ✅
- **Commit** : `76e90b2` — "Module 3 drivers owners people management" (+1498/-21)
- **Déploiement** : Hostinger via `deploy-full.mjs` + clé SSH `hostinger_new` ✅
- **Tests production** : site répond, API 401 attendu ✅

**Fichiers créés (9) :**
- `apps/web/src/components/people/MemberSelector.jsx`
- `apps/web/src/components/people/PersonRoleBadge.jsx`
- `apps/web/src/pages/DriversPage.jsx`
- `apps/web/src/pages/DriverCreatePage.jsx`
- `apps/web/src/pages/DriverDetailPage.jsx`
- `apps/web/src/pages/DriverEditPage.jsx`
- `apps/web/src/pages/OwnersPage.jsx`
- `apps/web/src/pages/OwnerCreatePage.jsx`
- `apps/web/src/pages/OwnerDetailPage.jsx`

**Fichiers modifiés (3) :**
- `apps/web/src/App.jsx` — 8 routes lazy loadées
- `apps/web/src/config/navigation.js` — chemins actifs pour drivers/owners
- `apps/web/src/pages/MembersPage.jsx` — badges rôles + filtres transport

### Session 11 — 02/07/2026 (Module 4 — Véhicules et Documents)

- **Composants créés (7)** :
  - `transport/VehicleForm.jsx` — formulaire complet avec validation, sélecteurs type/propriétaire/parking
  - `transport/VehicleCard.jsx` — carte mobile pour liste véhicules
  - `transport/VehicleTypeBadge.jsx` — badge coloré par type (Taxi-Moto, Taxi, Bus, Camion, Tricycle, Minibus)
  - `transport/OwnerSelector.jsx` — sélecteur propriétaire avec recherche membre lié
  - `transport/ParkingSelector.jsx` — sélecteur parking avec recherche
  - `documents/DocumentForm.jsx` — formulaire document avec upload fichier, entité liée, expiration
  - `documents/ExpiryBadge.jsx` — badge expiration (valide/bientôt expiré/expiré/sans expiration)
- **Pages véhicules (4)** :
  - `VehiclesPage.jsx` — liste + tableau desktop/cartes mobile + recherche (plaque, marque, modèle) + filtres (type, statut) + pagination 15/page
  - `VehicleCreatePage.jsx` — formulaire création avec VehicleForm
  - `VehicleDetailPage.jsx` — profil complet + infos propriétaire/parking + documents liés avec ExpiryBadge
  - `VehicleEditPage.jsx` — modification avec VehicleForm pré-rempli
- **Pages documents (4)** :
  - `DocumentsPage.jsx` — liste + recherche + filtres (entité liée, statut) + pagination + ExpiryBadge
  - `DocumentCreatePage.jsx` — création avec pré-remplissage via query params (`?related_type=vehicle&related_id=xxx`)
  - `DocumentDetailPage.jsx` — profil document + lien téléchargement fichier + expiration
  - `DocumentEditPage.jsx` — modification document
- **Routes** : 8 nouvelles routes protégées (`/vehicles`, `/vehicles/new`, `/vehicles/:id`, `/vehicles/:id/edit`, `/documents`, `/documents/new`, `/documents/:id`, `/documents/:id/edit`)
- **Navigation** : sidebar admin → Véhicules `/vehicles`, Documents `/documents` (plus ComingSoon), lignes/affectations/dettes restent ComingSoon
- **Logique expiration** : >30j = valide (vert), ≤30j = expire bientôt (orange), <0j = expiré (rouge), vide = aucune expiration (gris)
- **Performance** : getList paginé (15/page), Promise.all parallélisé, fetch types/parkings en rafale
- **Build** : 2893 modules, 0 erreurs ✅
- **Commit** : `14e0e06` — "Module 4 vehicles and documents management" (+1928/-3)
- **Déploiement** : Hostinger via `deploy-full.mjs` + clé SSH `hostinger_new` ✅

**Fichiers créés (15) :**
- `apps/web/src/components/transport/VehicleForm.jsx`
- `apps/web/src/components/transport/VehicleCard.jsx`
- `apps/web/src/components/transport/VehicleTypeBadge.jsx`
- `apps/web/src/components/transport/OwnerSelector.jsx`
- `apps/web/src/components/transport/ParkingSelector.jsx`
- `apps/web/src/components/documents/DocumentForm.jsx`
- `apps/web/src/components/documents/ExpiryBadge.jsx`
- `apps/web/src/pages/VehiclesPage.jsx`
- `apps/web/src/pages/VehicleCreatePage.jsx`
- `apps/web/src/pages/VehicleDetailPage.jsx`
- `apps/web/src/pages/VehicleEditPage.jsx`
- `apps/web/src/pages/DocumentsPage.jsx`
- `apps/web/src/pages/DocumentCreatePage.jsx`
- `apps/web/src/pages/DocumentDetailPage.jsx`
- `apps/web/src/pages/DocumentEditPage.jsx`

**Fichiers modifiés (2) :**
- `apps/web/src/App.jsx` — 8 routes lazy loadées
- `apps/web/src/config/navigation.js` — chemins actifs pour vehicles/documents
