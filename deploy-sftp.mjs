import Client from 'ssh2-sftp-client';
import { readFileSync } from 'fs';

async function deploy() {
  const sftp = new Client();
  try {
    console.log('Connexion au serveur FTP...');

    const auth = {};
    if (process.env.SFTP_KEY_PATH) {
      auth.privateKey = readFileSync(process.env.SFTP_KEY_PATH, 'utf8');
    } else {
      auth.password = process.env.SFTP_PASS;
    }

    await sftp.connect({
      host: process.env.SFTP_HOST || '82.25.113.196',
      port: parseInt(process.env.SFTP_PORT || '65002'),
      username: process.env.SFTP_USER || 'u135947442',
      ...auth,
    });
    console.log('Connecté!');

    const localDir = process.env.LOCAL_DIST || 'apps/web/dist';
    const remoteDir = process.env.REMOTE_DIR || '/home/u135947442/domains/alikamobility.alika-konnect.com/public_html';

    console.log(`Déploiement de ${localDir} vers ${remoteDir}...`);
    
    // Supprimer le contenu existant (optionnel)
    // await sftp.rmdir(remoteDir, true);
    // await sftp.mkdir(remoteDir, true);

    await sftp.uploadDir(localDir, remoteDir);
    console.log('Déploiement terminé avec succès!');
  } catch (err) {
    console.error('Erreur de déploiement:', err);
  } finally {
    sftp.end();
  }
}

deploy();
