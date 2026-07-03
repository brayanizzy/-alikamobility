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

  const localDir = process.env.LOCAL_DIST || 'apps/web/dist';
  const remoteDir = process.env.REMOTE_DIR || '/home/u135947442/domains/alikamobility.alika-konnect.com/public_html';

  try {
    console.log('⚡ OPENCONTROL : Tentative de connexion optimisée...');
    await sftp.connect(config);
    console.log('✅ Connecté au serveur Hostinger');

    // On vérifie si le dossier distant existe, sinon on le crée
    const exists = await sftp.exists(remoteDir);
    if (!exists) {
      console.log('Création du répertoire distant...');
      await sftp.mkdir(remoteDir, true);
    }

    console.log(`🚀 Déploiement des fichiers de ${localDir} vers ${remoteDir}...`);
    
    // Utilisation de uploadDir qui est plus robuste que le fastPut manuel
    await sftp.uploadDir(localDir, remoteDir);
    
    console.log('🎉 DÉPLOIEMENT RÉUSSI !');
    console.log('Le site devrait être à jour. Pense à vider le cache (Ctrl+F5).');
  } catch (err) {
    console.error('❌ Erreur critique lors du déploiement :');
    console.error(err);
    if (err.code === 'ECONNRESET') {
      console.log('Symptôme : Le serveur a coupé la connexion. Tentative de réduction de la charge...');
    }
  } finally {
    await sftp.end();
  }
}

deploy();
