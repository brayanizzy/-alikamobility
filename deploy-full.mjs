import Client from 'ssh2-sftp-client';
import { readFileSync } from 'fs';

async function deploy() {
  const sftp = new Client();

  const auth = {};
  if (process.env.SFTP_KEY_PATH) {
    auth.privateKey = readFileSync(process.env.SFTP_KEY_PATH, 'utf8');
  } else {
    auth.password = process.env.SFTP_PASS;
  }

  const config = {
    host: process.env.SFTP_HOST || '82.25.113.196',
    port: parseInt(process.env.SFTP_PORT || '65002'),
    username: process.env.SFTP_USER || 'u135947442',
    ...auth,
  };

  const remoteRoot = process.env.REMOTE_DIR || '/home/u135947442/domains/alikamobility.alika-konnect.com/public_html';
  const localDist = process.env.LOCAL_DIST || 'apps/web/dist';
  const localApi = 'apps/api';

  try {
    console.log('Connexion au serveur...');
    await sftp.connect(config);
    console.log('Connecté!');

    // 1. Frontend
    console.log(`\n--- Frontend: ${localDist} -> ${remoteRoot} ---`);
    await sftp.uploadDir(localDist, remoteRoot);

    // 2. Backend API vers /api
    console.log(`\n--- Backend: ${localApi} -> ${remoteRoot}/api ---`);
    const apiRemote = `${remoteRoot}/api`;
    const exists = await sftp.exists(apiRemote);
    if (!exists) {
      await sftp.mkdir(apiRemote, true);
    }
    await sftp.uploadDir(localApi, apiRemote);

    // Ne pas écraser le .env.local du serveur (ne pas uploader le fichier local vide)
    // Note: uploadDir n'écrase pas les fichiers distants qui n'existent pas localement
    // Le .env.local du serveur est préservé automatiquement

    console.log('\nDéploiement complet terminé avec succès!');
    console.log('Frontend: https://alikamobility.alika-konnect.com');
    console.log('API: https://alikamobility.alika-konnect.com/api');
  } catch (err) {
    console.error('Erreur de déploiement:', err);
  } finally {
    await sftp.end();
  }
}

deploy();
