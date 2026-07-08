import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicyPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const lastUpdated = '8 juillet 2026';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto max-w-4xl flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src="/assets/images/logo.png" alt="Alika Mobility" className="h-8 w-auto rounded-lg" />
            <span className="font-bold text-lg">Alika Mobility</span>
          </Link>
          <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">Politique de confidentialite</h1>
        <p className="text-sm text-muted-foreground mb-8">Derniere mise a jour : {lastUpdated}</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-bold mb-2">1. Introduction</h2>
            <p>
              Alika Mobility (« l'Application ») est une plateforme de gestion destinee aux associations
              de transport, notamment les associations de taxi-moto en Republique Democratique du Congo.
              Cette politique de confidentialite decrit comment nous collectons, utilisons, stockons et
              protegeons les donnees personnelles de nos utilisateurs.
            </p>
            <p>
              L'Application est exploitee par ALIKA KONNECT. En utilisant l'Application, vous acceptez les
              pratiques decrites dans cette politique.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">2. Donnees collectees</h2>
            <p>Nous collectons les types de donnees suivants :</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Comptes utilisateurs :</strong> nom, prenom, adresse e-mail, mot de passe (hache), role (super-admin, admin, agent).</li>
              <li><strong>Membres d'association :</strong> nom, prenom, telephone, adresse, code membre, photo (optionnelle).</li>
              <li><strong>Chauffeurs et proprietaires :</strong> numero de permis, categorie, expiration, certificat medical, informations vehicule.</li>
              <li><strong>Paiements et encaissements :</strong> montant, methode (especes, mobile money, virement), date, agent collecteur, recu associe.</li>
              <li><strong>Dettes et penalites :</strong> montant initial, montant restant, statut, motif.</li>
              <li><strong>Cartes membres QR :</strong> numero de carte, type, date d'emission, date d'expiration, code HMAC de securite.</li>
              <li><strong>Notifications :</strong> messages internes, logs d'envoi (e-mail, SMS, WhatsApp), statut de livraison.</li>
              <li><strong>Vehicules et documents :</strong> plaque, marque, modele, type, documents associes (assurance, visite technique).</li>
              <li><strong>Donnees techniques :</strong> adresse IP, type d'appareil, journaux d'erreur, statistiques d'utilisation agrégees.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">3. Finalites du traitement</h2>
            <p>Les donnees sont utilisees exclusivement pour :</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Gerer les comptes utilisateurs et controler les acces selon les roles.</li>
              <li>Enregistrer et suivre les membres, chauffeurs, proprietaires et vehicules des associations.</li>
              <li>Encaisser et tracer les paiements, generer des recus et des rapports financiers.</li>
              <li>Gerer les dettes, penalites et echeances.</li>
              <li>Emettre et verifier les cartes membres par QR code securise (HMAC-SHA256).</li>
              <li>Envoyer des notifications (e-mail, SMS, WhatsApp) aux membres et agents.</li>
              <li>Permettre le fonctionnement en mode hors ligne et la synchronisation ulterieure.</li>
              <li>Assurer la securite, l'audit et le bon fonctionnement technique de la plateforme.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">4. Base legale</h2>
            <p>
              Le traitement des donnees repose sur : l'execution d'un contrat (gestion de l'association),
              l'interet legitime (securite, audit, prevention des fraudes), et le consentement (notifications
              par e-mail/SMS/WhatsApp). Les donnees sensibles (mot de passe) sont hachees avec un algorithme
              irreversible (bcrypt/PBKDF2).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">5. Stockage et securite</h2>
            <p>
              Les donnees sont stockees dans une base de donnees MySQL hebergee chez Hostinger, dans des
              centres de donnees securises. Les mesures de securite incluent :
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Chiffrement TLS/SSL pour toutes les communications (HTTPS).</li>
              <li>Hachage des mots de passe (jamais stockes en clair).</li>
              <li>Tokens de session aleatoires (15+ caracteres) stockes en base avec expiration.</li>
              <li>Limitation du taux de tentatives de connexion (anti force brute).</li>
              <li>HMAC-SHA256 pour la verification des QR codes de cartes membres.</li>
              <li>Logs d'audit pour les actions sensibles (super-admin).</li>
              <li>Fichiers uploads validates (MIME, taille max 5 Mo, extensions autorisees uniquement).</li>
            </ul>
            <p className="mt-2">
              En mode hors ligne, les donnees saisies sur le terrain sont stockees localement sur l'appareil
              (IndexedDB) et synchronisees des qu'une connexion est disponible. Les donnees hors ligne sont
              supprimees de l'appareil apres synchronisation reussie.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">6. Sous-traitants et tiers</h2>
            <p>Nous faisons appel aux prestataires suivants pour le fonctionnement de l'Application :</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Hostinger</strong> : hebergement web et base de donnees MySQL (serveurs securises).</li>
              <li><strong>Brevo (Sendinblue)</strong> : envoi d'e-mails transactionnels et notifications.</li>
              <li><strong>Fournisseurs SMS / WhatsApp</strong> : envoi de notifications (API REST, mode dry-run activable).</li>
            </ul>
            <p className="mt-2">
              Aucune donnee personnelle n'est vendue ou cedee a des tiers a des fins commerciales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">7. Duree de conservation</h2>
            <p>
              Les donnees sont conservees pour la duree necessaire au fonctionnement de l'association et a
              l'execution de ses obligations legales et comptables. Les comptes inactifs pendant plus de 24
              mois peuvent etre anonymises ou supprimes. Les logs d'audit sont conserves 12 mois. Les
              sessions expirent automatiquement apres 7 jours d'inactivite.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">8. Vos droits</h2>
            <p>Conformement a la legislation applicable, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Droit d'acces a vos donnees personnelles.</li>
              <li>Droit de rectification des donnees inexactes.</li>
              <li>Droit a l'effacement (« droit a l'oubli »).</li>
              <li>Droit a la limitation du traitement.</li>
              <li>Droit a la portabilite de vos donnees.</li>
              <li>Droit d'opposition au traitement.</li>
            </ul>
            <p className="mt-2">
              Pour exercer ces droits, contactez-nous a l'adresse indiquee a la section 10. Les responsables
              d'association peuvent egalement gerer les donnees de leurs membres directement depuis
              l'Application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">9. Verification publique des cartes membres</h2>
            <p>
              Les QR codes des cartes membres contiennent un jeton HMAC securise. Lors de la verification
              publique d'une carte, seules les informations limitees suivantes sont affichees : nom du membre,
              code membre, statut de la carte, type, date d'expiration, et presence ou non d'une dette ouverte
              (oui/non). Aucune information sensible (telephone, e-mail, adresse) n'est affichee publiquement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">10. Contact</h2>
            <p>
              Pour toute question relative a cette politique de confidentialite ou pour exercer vos droits,
              vous pouvez nous contacter :
            </p>
            <ul className="list-none pl-6 space-y-1 mt-2">
              <li><strong>E-mail :</strong> contact@alika-konnect.com</li>
              <li><strong>Site web :</strong> https://alikamobility.alika-konnect.com</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">11. Modifications</h2>
            <p>
              Cette politique peut etre mise a jour periodically. La date de derniere mise a jour est indiquee
              en haut de cette page. Nous vous informerons de tout changement important via l'Application ou
              par e-mail.
            </p>
          </section>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-border/40 pt-6">
          <Link to="/" className="text-sm font-semibold text-primary hover:underline">
            Retour a l'accueil
          </Link>
          <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicyPage;
