# ALIKA MOBILITY — Déploiement

## Avant chaque déploiement

```bash
# 1. Vérifier l'état Git
git status

# 2. Lancer tous les contrôles qualité
npm run check:all

# 3. (Optionnel) Sauvegarder la base de données
# Copier les credentials depuis apps/api/.env.local
# DB_HOST=... DB_NAME=... DB_USER=... DB_PASS=... node scripts/backup-db.mjs
```

## Déploiement

```bash
# Déploiement complet (frontend + backend)
SFTP_PASS="..." node deploy-full.mjs

# Ou avec clé SSH
SFTP_KEY_PATH="~/.ssh/hostinger_new" node deploy-full.mjs
```

## Après déploiement

```bash
# 1. Vérifier le frontend
curl -I https://alikamobility.alika-konnect.com

# 2. Vérifier l'API
curl https://alikamobility.alika-konnect.com/api/health

# 3. Vérifier les endpoints critiques
curl -I https://alikamobility.alika-konnect.com/api/auth/login

# 4. Vérifier l'interface
# Naviguer vers https://alikamobility.alika-konnect.com
```

## Règles

- Ne jamais commiter `.env.local`
- Ne jamais commiter des mots de passe
- Ne jamais désactiver `NOTIFICATION_DRY_RUN=true`
- Vérifier que le build passe avant chaque déploiement
- Faire un backup DB avant les déploiements majeurs

## Commandes utiles

| Commande | Description |
|----------|-------------|
| `npm run build` | Build frontend |
| `npm run test` | Tests frontend Vitest |
| `npm run php-lint` | Lint PHP (11 fichiers) |
| `npm run check:secrets` | Scan secrets dangereux |
| `npm run check:all` | Tout ci-dessus |
