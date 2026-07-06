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
│   │   ├── email.php         # Mails via Brevo API
│   │   ├── notifications.php # Notifications + cron
│   │   ├── card-security.php # HMAC-SHA256 QR sécurisé
│   │   ├── reports.php       # Rapports avancés
│   │   ├── migrations.sql    # Index MySQL
│   │   ├── migrations-v2-transport-core.sql # Tables V2 transport
│   │   └── .htaccess         # Rewrite → router.php
│   └── web/                  # Frontend React + Vite
│       ├── src/
│       │   ├── lib/
│       │   │   └── apiClient.js         # ✅ Client API custom (import via @/lib/apiClient)
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
│       │   │   ├── ErrorBoundary.jsx    # Anti écran blanc
│       │   │   ├── PaginationControls.jsx
│       │   │   ├── cards/               # Module 7 — Cartes membres QR
│       │   │   ├── transport/           # Module 4 — Véhicules
│       │   │   ├── documents/           # Module 4 — Documents
│       │   │   └── dashboard/           # Module 2 — KPIs
│       │   ├── pages/                   # ~60 pages lazy-loaded
│       │   └── utils/
│       │       ├── OfflineService.js    # Offline-first IndexedDB
│       │       └── ...
│       └── dist/                        # Build de production (gitignored)
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
2. **Module 10 — Prochain module** (WIP UI stashé — à reprendre depuis HEAD)
3. Valider les permissions agents (lecture seule chauffeurs/propriétaires/véhicules/documents)

### Modules déjà livrés (0–9.2)
- Module 0.1: Fondations Backend V1 ✅
- Module 0.2: Pagination réelle + stabilité ✅
- Module 1: UX/Navigation terrain ✅
- Module 2: Dashboards professionnels par rôle ✅
- Module 3: Drivers/Owners People Management ✅
- Module 4: Véhicules et Documents ✅
- Module 5: Lignes/Affectations ✅
- Module 6: Dettes/Pénalités/Reçus ✅
- Module 7: Cartes membres QR ✅
- Module 7.1: Sécurisation QR HMAC-SHA256 ✅
- Module 7.2: HMAC secret dev/prod fallback ✅
- Module 8: Offline avancé ✅
- Module 8.1: Fix offline validation (memory leak) ✅
- Module 9: Rapports PDF/Excel avancés ✅
- Module 9.1: Validation fonctionnelle rapports ✅
- Module 9.2: Fix auth session persistence ✅

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

### Session 12 — 02/07/2026 (Module 7 — Cartes membres, QR code et vérification)

- **Composants créés (5)** :
  - `cards/MemberCardForm.jsx` — formulaire complet avec MemberSelector, type de carte (standard/premium/vip), dates émission/expiration, PIN optionnel
  - `cards/MemberCardPreview.jsx` — aperçu carte type bancaire avec gradient par type, badge statut, numéro, dates
  - `cards/QRCodeDisplay.jsx` — QR code via qrcode.react encodant URL `/verify/card/{card_number}`
  - `cards/CardVerificationResult.jsx` — résultat vérification publique (valide/invalide, dette ouverte, infos limitées)
  - `cards/PrintableMemberCard.jsx` — carte imprimable via `@media print` avec QR code intégré
- **Pages cartes membres (5)** :
  - `MemberCardsPage.jsx` — liste paginée (15/page), recherche, filtre statut, chargement noms membres en rafale
  - `MemberCardCreatePage.jsx` — création avec génération automatique numéro (CARD-XXXXXX)
  - `MemberCardDetailPage.jsx` — profil carte + aperçu + QR + infos sécurité + métadonnées
  - `MemberCardEditPage.jsx` — modification avec MemberCardForm pré-rempli
  - `MemberCardPrintPage.jsx` — impression via PrintableMemberCard avec bouton Imprimer
- **Page vérification publique (1)** :
  - `CardVerifyPage.jsx` — publique (sans ProtectedRoute), saisie manuelle + QR, affiche membre/dette/dates, données sensibles masquées
- **Backend** :
  - `router.php` : `GET /cards/verify` → `handleCardVerify()` — recherche carte par card_number, retourne infos limitées membre + dette ouverte
  - `crud.php` : validation `card_type` enum (standard/premium/vip)
- **ScannerPage** : support QR cartes membres (détection URL `/verify/card/`, lookup member via card, vérification statut actif)
- **Navigation** : Cartes membres activé (`/member-cards`) dans finances admin
- **Routes** : 5 protégées + 1 publique (`/verify/card/:cardNumber`)
- **Build** : 2937 modules, 0 erreurs ✅
- **PHP lint** : crud.php, router.php valides ✅
- **Commit** : `77664e8` — "Module 7 member cards QR code and verification" (+1462/-80)
- **Déploiement** : Hostinger via `deploy-full.mjs` + clé SSH `hostinger_new` ✅
- **Tests production** : frontend SPA OK, API endpoint `/cards/verify` répond avec `{"error":"Carte introuvable"}` pour carte test ✅

**Fichiers créés (11) :**
- `apps/web/src/components/cards/MemberCardForm.jsx`
- `apps/web/src/components/cards/MemberCardPreview.jsx`
- `apps/web/src/components/cards/QRCodeDisplay.jsx`
- `apps/web/src/components/cards/CardVerificationResult.jsx`
- `apps/web/src/components/cards/PrintableMemberCard.jsx`
- `apps/web/src/pages/MemberCardsPage.jsx`
- `apps/web/src/pages/MemberCardCreatePage.jsx`
- `apps/web/src/pages/MemberCardDetailPage.jsx`
- `apps/web/src/pages/MemberCardEditPage.jsx`
- `apps/web/src/pages/MemberCardPrintPage.jsx`
- `apps/web/src/pages/CardVerifyPage.jsx`

**Fichiers modifiés (5) :**
- `apps/api/crud.php` — validation card_type enum
- `apps/api/router.php` — endpoint GET /cards/verify
- `apps/web/src/App.jsx` — 5 routes cartes + 1 publique vérification
- `apps/web/src/config/navigation.js` — Cartes membres activé
- `apps/web/src/pages/ScannerPage.jsx` — support QR cartes membres

### Session 14 — 02/07/2026 (Module 9.1 — Validation fonctionnelle rapports/exports/permissions)

- **Création du script de données de test** `setup-test-data.php` :
  - 2 orgs (A: Kinshasa pro, B: Lubumbashi starter), 5 comptes utilisateurs (super-admin + admin A + field A + office A + admin B)
  - Données : 5 membres (3 A + 2 B), 1 driver, 1 owner, 1 véhicule (Taxi-Moto), 1 ligne, 1 affectation, 1 carte membre avec QR, 3 dettes (2 A + 1 B), 1 pénalité, 4 paiements (3 A cash/mobile/bank + 1 B cash), 1 reçu
  - Mots de passe forts (18 chars aléatoires), hash via `password_hash()`
  - Script nettoyé du serveur après tests
- **Bugs backend reports.php corrigés** (5 bugs majeurs) :
  1. `handleReportsOverview()` : `$orgFilter` utilisait `p.organization_id` mais le FROM `payments` n'était pas aliasé → ajout `$orgFilterNoPrefix` (strip `p.`)
  2. `handleReportsDebts()`, `handleReportsMembers()` : param ordering inversé (org_id avant dates) et `$orgSql AND` crashait pour super-admin sans filtre (dangling `AND`) → création `$whereAnd` + aliases par table avec préfixes
  3. `handleReportsTransport()` : `lines` est mot réservé MySQL → backticks `` `lines` ``
  4. `vehicle_type_id` vs `type_id` dans transport handler
  5. `array_merge($params, [$from, $to])` inversait l'ordre org_id/dates dans overview → ajout `$dateOrgParams`
- **Tests API en production** :
  - 7 endpoints reports : overview, payments, debts, transport, members, agent-performance, cashier — tous ✅ 200
  - **Org isolation** : Admin B voit uniquement Org B (2 membres, 1 debt, 0 vehicles), pas de fuite Org A ✅
  - **Super-admin** : sans filtre voit toutes les orgs (4 payments, 7 members), avec `?organization_id=` ne voit que l'org ciblée ✅
  - **Office agent** : /reports/cashier répond (0 payments collectés par l'agent) ✅
  - **Permissions** : pas de blocage rôle explicite sur les endpoints (tout user auth peut accéder), mais les données sont filtrées par org_id et collector_id
- **Exports CSV** testés avec données réelles (encaissements, dettes, agents, caisse) : BOM UTF-8, `;` OK, accents OK, montants OK, pas de `[object Object]` ✅
- **Impression/PDF** vérifiée : ReportPrintLayout avec @media print, navigation masquée, titre/période/footer visibles ✅
- **Build** : 2949 modules, 0 erreurs ✅
- **PHP lint** : reports.php + router.php ✅
- **Commit** : `4e733a2` — "Fix Module 9 reports validation issues" (+154/-18)
- **Déploiement** : Hostinger via `deploy-full.mjs` + clé SSH `hostinger_new` ✅ (reports.php + router.php)

**Fichiers modifiés (2) :**
- `apps/api/reports.php` — 5 bugs SQL corrigés
- `apps/api/router.php` — revert du mode debug (retour générique 500)

### Session 13 — 02/07/2026 (Module 7.1 — Sécurisation QR HMAC-SHA256)

- **Problème** : QR codes des cartes membres utilisaient uniquement le `card_number` séquentiel (`CARD-000001`), donc devinable et falsifiable.
- **Solution** : HMAC-SHA256 avec `qr_secret` aléatoire par carte + secret serveur (`CARD_QR_HMAC_SECRET`).
- **Structure DB** : `member_cards.qr_secret` existait déjà (VARCHAR(255) — migration V2). Aucune migration nécessaire.
- **Backend** :
  - `card-security.php` (nouveau) : `getCardHmacSecret()`, `generateCardQrSecret()`, `computeCardHmac()`, `verifyCardToken()`, `generateSecureVerifyUrl()`
  - `router.php` : ajout `GET /cards/secure-url` (protégé) + modification `GET /cards/verify` (accepte `token`, vérifie HMAC, vérifie statut/expiration, refuse cartes avec `qr_secret` sans token)
  - `crud.php` : auto-génération `qr_secret` à la création d'une carte membre
  - `config.php` : define `CARD_VERIFY_BASE_URL`, HMAC secret via env `CARD_QR_HMAC_SECRET`
- **Frontend** :
  - `QRCodeDisplay.jsx` : accepte `verifyUrl` prop (sécurisé) en priorité
  - `PrintableMemberCard.jsx` : accepte `verifyUrl` prop
  - `MemberCardDetailPage.jsx` : fetch `/cards/secure-url` pour QR sécurisé
  - `MemberCardPrintPage.jsx` : fetch `/cards/secure-url` pour QR imprimé
  - `CardVerifyPage.jsx` : extrait `token` de l'URL et le passe à l'API
  - `CardVerificationResult.jsx` : gère `result.success !== false`
- **ScannerPage** : inchangé (les agents authentifiés utilisent l'API CRUD, pas le endpoint public)
- **Backfill** : automatique à la volée — si `qr_secret` est vide lors d'une vérification ou génération d'URL sécurisée, il est généré et sauvegardé
- **Compatibilité** : les anciennes cartes sans `qr_secret` sont automatiquement backfillées à la première lecture
- **Sécurité publique** : données limitées (nom, code membre, statut carte, type, expiration, dette ouverte oui/non). Pas de téléphone, email, adresse, notes internes.
- **Build** : 2937 modules, 0 erreurs ✅
- **PHP lint** : 4/4 fichiers OK ✅
- **Tests API** :
  - `GET /cards/verify?card_number=test&token=bad` → `{"success":false,"status":"invalid_token","message":"..."}` ✅
  - `GET /cards/verify?card_number=test` → `{"error":"Carte introuvable"}` ✅
  - `GET /cards/secure-url?id=test` (sans auth) → `{"error":"Unauthorized"}` ✅
- **Commit** : `ddf6c8b` — "Module 7.1 secure member card QR HMAC" (+297/-14)
- **Déploiement** : Hostinger via `deploy-full.mjs` + clé SSH `hostinger_new` ✅

**Fichier créé (1) :**
- `apps/api/card-security.php` — fonctions HMAC + génération/sécurisation QR

**Fichiers modifiés (9) :**
- `apps/api/config.php` — define CARD_VERIFY_BASE_URL
- `apps/api/crud.php` — auto-génération qr_secret à la création
- `apps/api/router.php` — endpoint secure-url + vérification HMAC
- `apps/web/src/components/cards/QRCodeDisplay.jsx` — support verifyUrl prop
- `apps/web/src/components/cards/PrintableMemberCard.jsx` — support verifyUrl prop
- `apps/web/src/components/cards/CardVerificationResult.jsx` — gestion success field
- `apps/web/src/pages/MemberCardDetailPage.jsx` — fetch secure URL
- `apps/web/src/pages/MemberCardPrintPage.jsx` — fetch secure URL
- `apps/web/src/pages/CardVerifyPage.jsx` — extraction et passage token

### Session 15 — 03/07/2026 (Phase 1: Déploiement Module 9.2 + Phase 2: Nettoyage Git)

- **Module 9.2 déployé en production** depuis worktree propre (commit `65e8688`)
  - Frontend-only deploy (script `deploy-frontend-9-2.mjs`) — API backend non touché
  - Build : 0 erreurs, 25.91s
  - Production : frontend ✅ 200, sw.js v1.0.3 ✅, API intacte ✅
- **Nettoyage PocketBase terminé** :
  - `apps/pocketbase/` retiré du suivi Git (`git rm -r`)
  - Plugin Vite `vite-plugin-pocketbase-auth.js` supprimé
  - `pocketbaseClient.js` (shim) supprimé
  - Tous les imports `@/lib/pocketbaseClient` remplacés par `@/lib/apiClient` (68 fichiers)
  - `dist/` retiré du suivi Git
- **Backend PHP tracké** : `auth.php`, `email.php`, `files.php`, `notifications.php`, `.htaccess`, `migrations.sql`, `migrations-v2-transport-core.sql` ajoutés à Git
- **Commit A** : suppression traces PocketBase
- **Commit B** : ajout fichiers backend PHP
- **Commit C** : mise à jour AGENTS.md
- **Working tree final** : propre (seulement WIP UI non commités)

### Session 17 — 03/07/2026 (Module 10 — Notifications multi-canal + Phase 3.1 final)
- **Phase 3.1 finalisée** : 8 fichiers WIP migrés de `pocketbaseClient` → `apiClient` : MemberForm.jsx, PaymentForm.jsx, AgentProfilePage.jsx, AgentsPage.jsx, LatePaymentsPage.jsx, MembersListPage.jsx, NotificationsPage.jsx, SignupPage.jsx. Shim `pocketbaseClient.js` supprimé. Dépendances `pocketbase` + `react-helmet` retirées du package.json. Root `package.json` nettoyé.
- **3 commits Phase 3.1** : `55251a3`, `d7ea659`, `9a7c91f`.
- **Module 10 — Backend** :
  - `notification-providers.php` : Providers Email (Brevo), SMS (API REST générique), WhatsApp (Cloud API). Normalisation téléphone RDC `+243`. Mode dry-run via `NOTIFICATION_DRY_RUN=true`.
  - `notification-templates.php` : CRUD templates + 11 templates français pré-définis (debt_reminder, payment_receipt, penalty_notice, document_expiry, member_card_ready, admin_custom_message) avec variantes SMS/WhatsApp.
  - `notifications.php` : Réécriture complète — `sendMultiChannelNotification()`, logs avec idempotence, retry, cron reminders (dettes >30j, documents expire J-7/J). Endpoints API : notifications (GET, mark-read, mark-all-read, unread-count), templates (CRUD, seed), logs (GET, retry), actions rapides (send-debt-reminder, send-payment-receipt, send-penalty-notice, send-custom-message), cron daily reminders.
  - `config.php` : Ajout `getNotificationConfig()`.
  - `router.php` : 15 nouvelles routes notification.
  - `migrations-module10-notifications.sql` : Tables `notification_templates`, `notification_logs` + colonnes `channel`, `notification_log_id` sur `notifications`.
- **Module 10 — Frontend** :
  - `NotificationSendPage.jsx` : Page d'envoi multi-canal — sélection canal, recherche destinataire (members/drivers/users), choix template, aperçu message, dry-run toggle, résultat avec ID log.
  - `NotificationsPage.jsx` : Liste avec filtres type/canal, vue logs d'envoi avec statuts, retry sur logs échoués, pagination.
  - `NotificationBell.jsx` : Compteur non lues via `/notifications/unread-count`.
  - **Route** `/notifications/send` ajoutée dans `App.jsx` (admin/super-admin).
- **Build** : `npm run build` ✅ (2945 modules, 0 erreur, 33.25s)
- **Fichiers créés (5)** : `apps/api/notification-providers.php`, `apps/api/notification-templates.php`, `apps/api/migrations-module10-notifications.sql`, `apps/web/src/pages/NotificationSendPage.jsx`, (réécriture `apps/api/notifications.php`)
- **Fichiers modifiés (6)** : `apps/api/config.php`, `apps/api/router.php`, `apps/web/src/pages/NotificationsPage.jsx`, `apps/web/src/components/NotificationBell.jsx`, `apps/web/src/App.jsx`, `AGENTS.md`
- **Déploiement** : Hostinger via `deploy-full.mjs` + clé SSH `hostinger_new` ✅
- **Fichier `.env.local` restauré** sur le serveur avec DB_HOST, DB_NAME, DB_USER, DB_PASS, BREVO_API_KEY, ALLOWED_ORIGINS, CARD_QR_HMAC_SECRET, CRON_SECRET, NOTIFICATION_DRY_RUN.

### Session 18 — 06/07/2026 (Module 10.1 — Commit, migration, validation)
- **Module 10 commité** : `0d941d9` — "Module 10 multi-channel notification system" (14 files, +1711/-200)
- **Fichiers sensibles supprimés** : `api-test.php`, `run-api-test.mjs` (contenaient mots de passe en clair)
- **`tools/generate-llms.js` corrigé** : `process.exit(1)` → `process.exit(0)` quand react-helmet absent (exit 0)
- **`.gitignore` enrichi** : patterns `api-test.php`, `run-api-test.mjs`, `*-test-local.*`, `local-test-*`
- **`deploy-full.mjs` corrigé** : ne supprime plus `.env.local` distant après upload (causait perte des credentials DB à chaque déploiement)
- **`.env.local` restaurant** sur le serveur (DB credentials + nouveaux secrets CARD_QR_HMAC_SECRET + CRON_SECRET générés)
- **Migration DB exécutée** : tables `notification_templates`, `notification_logs` créées, colonnes `channel` + `notification_log_id` ajoutées à `notifications`
- **Build** : 2945 modules, 0 erreurs ✅
- **PHP lint** : 7/7 fichiers OK ✅
- **API rétablie** : login retourne "Invalid email or password" (DB OK) au lieu de 500
- **Commits supplémentaires** :
  - `0d941d9` — Module 10 initial (déjà compté ci-dessus)
  - Fix `deploy-full.mjs` — correction suppression `.env.local` distant

**Fichiers modifiés :**
- `deploy-full.mjs` — correction critique (ne plus supprimer .env.local distant)
- `apps/web/tools/generate-llms.js` — exit 0 au lieu de exit 1
- `.gitignore` — exclusion fichiers test locaux
- `AGENTS.md` — mise à jour session log

- **Module 9.2 déjà en production** depuis Session 15 — vérifié intact ✅
- **Suppression de 3 fichiers sensibles** : `list-pikapods.mjs`, `test-ssh.mjs`, `sshkey.txt` — contenaient mots de passe en clair
- **Fallbacks de mots de passe supprimés** (4 fichiers) :
  - `deploy-full.mjs`, `deploy-optimized.mjs`, `deploy-sftp.mjs` — plus de `SFTP_PASS` fallback `'Alika@2025'`
  - `apps/api/config.php` — plus de fallback `'Alika@2025'` pour DB_HOST/DB_NAME/DB_USER/DB_PASS
  - `apps/api/notifications.php` — plus de fallback `'alika-cron-secret-2025'` pour CRON_SECRET
  - `apps/api/card-security.php` — plus de fallback `'alika-mobility-hmac-dev-fallback'` pour APP_SECRET
- **`.gitignore` durci** : ajout `*.pem`, `*.key`, `*.ppk`, `*secret*`, etc.
- **`vite.config.js` nettoyé** : suppression des imports morts (plugin pocketbase-auth, visual-editor, selection-mode, iframe-route-restoration — supprimés dans Session 15)
- **Fichiers manquants restaurés** : `pocketbaseClient.js` (shim temporaire), `ErrorBoundary.jsx`, `PendingApprovalPage.jsx`, `roles.js`, `currency.js` — existaient en untracked mais jamais commités
- **Stash supprimé** : les WIP UI (HomePage, SignupPage, MembersListPage, agents, forms, notifications, etc.) ont été stashees puis droppées car non finalisées
- **Phase 3.1 — Finalisation** : les 8 imports `pocketbaseClient` restants remplacés par `apiClient` ; shim `pocketbaseClient.js` supprimé ; `pocketbase` npm dependency retirée ; scripts `apps/pocketbase` effacés du root `package.json`
- **Build vérifié** : `npm run build` ✅ (2945 modules, 34.82s, 0 erreur)
- **PHP lint** : 7/7 fichiers OK ✅
- **Working tree** : propre ✅
- **Commits** (3 nouveaux, 7 au total depuis Module 9.2) :
  - `cc7aa79` — "Fix: remove hardcoded secrets from PHP and deploy scripts"
  - `ef43f3a` — "Fix build: restore pocketbaseClient shim and missing deps"
  - `d6f8e91` — "Finalize security cleanup and remove PocketBase shim"

**Fichiers modifiés (3) :**
- `apps/web/vite.config.js` — imports plugins morts supprimés
- `apps/api/card-security.php` — fallback HMAC dev supprimé
- `apps/api/notifications.php` — fallback CRON_SECRET supprimé
- (config.php, deploy-*.mjs, .gitignore déjà modifiés en Session 2/15)

**Fichiers restaurés (5) :**
- `apps/web/src/lib/pocketbaseClient.js` — shim apiClient restauré puis supprimé
- `apps/web/src/components/ErrorBoundary.jsx` — ErrorBoundary commité
- `apps/web/src/pages/PendingApprovalPage.jsx` — page lazy-loadée par App.jsx
- `apps/web/src/utils/roles.js` — importé par App.jsx, Header.jsx, + 5 pages
- `apps/web/src/utils/currency.js` — importé par ~30 fichiers
