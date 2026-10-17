// Privacy policy, terms of use and legal notice (FR/EN), opened from the login screen and from Settings.
// Contact email and data region come from config.js. Bump LEGAL_VERSION when the texts change.
(() => {
  'use strict';
  const { $, S, t, esc } = ML;
  const LEGAL_VERSION = '2026-10-17';
  ML.LEGAL_VERSION = LEGAL_VERSION;
  const CFG = () => window.MLI_CONFIG || {}; // config.js loads after this file
  const EMAIL = () => CFG().contactEmail || '—';
  const REGION = () => { const r = CFG().dataRegion; if (r && typeof r === 'object') return r[S.lang === 'en' ? 'en' : 'fr']; return r || (S.lang === 'en' ? 'the region chosen for the project' : 'la région choisie pour le projet'); };
  const SITE = 'https://lostfrommerlinhermes.github.io/MerlinsLock-in/';

  ML.addStrings({
    fr: {
      legal_privacy: 'Politique de confidentialité', legal_terms: 'Conditions d’utilisation', legal_notice: 'Mentions légales', legal_about: 'À propos et légal',
      legal_updated: 'Mise à jour : {d}', legal_about_p: 'MerlinsLockIN est un projet personnel, gratuit et non commercial.',
      consent: 'J’ai 15 ans ou plus (ou l’accord d’un parent) et j’accepte les {terms} et la {privacy}.', consent_terms: 'conditions d’utilisation', consent_privacy: 'politique de confidentialité',
      err_consent: 'Pour créer un compte, accepte les conditions d’utilisation et la politique de confidentialité.',
    },
    en: {
      legal_privacy: 'Privacy policy', legal_terms: 'Terms of use', legal_notice: 'Legal notice', legal_about: 'About and legal',
      legal_updated: 'Last updated: {d}', legal_about_p: 'MerlinsLockIN is a personal, free and non-commercial project.',
      consent: 'I am 15 or older (or have a parent’s permission) and I accept the {terms} and the {privacy}.', consent_terms: 'terms of use', consent_privacy: 'privacy policy',
      err_consent: 'To create an account, accept the terms of use and the privacy policy.',
    },
  });

  const DOCS = {
    fr: {
      privacy: () => `
        <p>Cette politique explique quelles données MerlinsLockIN utilise et comment. MerlinsLockIN est un projet personnel et gratuit, sans publicité, sans pistage et sans revente de données.</p>
        <h4>Responsable du traitement</h4>
        <p>L’éditeur de MerlinsLockIN (pseudonyme « LostfromMerlinHermes »), joignable à <b>${esc(EMAIL())}</b>.</p>
        <h4>Sans compte</h4>
        <p>Tout reste sur ton appareil, dans le stockage local du navigateur : tâches, sessions, agenda, journal, réglages et progression. Rien n’est envoyé à l’éditeur.</p>
        <h4>Avec un compte</h4>
        <ul>
          <li><b>Données :</b> ton adresse e-mail, ton mot de passe (stocké chiffré par notre prestataire, jamais lisible par l’éditeur), le contenu de l’app que tu y mets (tâches, notes, sessions, agenda, journal, réglages, progression) et des données techniques de connexion (dates de connexion, adresse IP dans les journaux du prestataire).</li>
          <li><b>Pourquoi :</b> créer et sécuriser ton compte, et synchroniser tes données entre tes appareils.</li>
          <li><b>Base légale :</b> l’exécution du service que tu demandes en créant un compte (article 6.1.b du RGPD).</li>
          <li><b>Durée :</b> tant que ton compte existe. Quand tu le supprimes, tes données sont effacées immédiatement ; les sauvegardes techniques du prestataire disparaissent ensuite à leur rotation normale.</li>
        </ul>
        <h4>Prestataires</h4>
        <ul>
          <li><b>Supabase Inc.</b> héberge les comptes et les données synchronisées, dans ${esc(REGION())}. Les échanges sont chiffrés (HTTPS) et des règles de sécurité empêchent chaque utilisateur de lire les données des autres.</li>
          <li><b>GitHub Inc.</b> héberge le site. Comme tout hébergeur, il peut enregistrer l’adresse IP des visiteurs dans ses journaux techniques.</li>
        </ul>
        <p>Les polices sont hébergées avec l’app : aucune requête n’est faite à Google. Le stockage local utilisé est strictement nécessaire au fonctionnement ; il n’y a pas de cookie publicitaire ni de mesure d’audience.</p>
        <h4>Tes droits</h4>
        <p>Tu peux accéder à tes données, les corriger, les exporter (Réglages → Sauvegarde → Télécharger un fichier), t’opposer à leur traitement ou les effacer (Réglages → Compte → Supprimer mon compte). Pour toute demande : <b>${esc(EMAIL())}</b>. Tu peux aussi adresser une réclamation à la CNIL (cnil.fr).</p>
        <h4>Mineurs</h4>
        <p>La création d’un compte est réservée aux personnes de 15 ans ou plus, ou plus jeunes avec l’accord d’un parent.</p>
        <h4>Modifications</h4>
        <p>Cette politique peut évoluer ; la date de mise à jour est indiquée en haut.</p>`,
      terms: () => `
        <h4>1. Objet</h4>
        <p>MerlinsLockIN est une application gratuite d’organisation et de concentration (minuteur, planning, agenda, sons, jeu). En l’utilisant, tu acceptes ces conditions.</p>
        <h4>2. Accès au service</h4>
        <p>Le service est fourni gratuitement, « en l’état », sans garantie de disponibilité ni d’absence d’erreurs. Il peut évoluer, être interrompu ou arrêté à tout moment.</p>
        <h4>3. Compte</h4>
        <p>Pour créer un compte, tu dois avoir 15 ans ou plus, ou l’accord d’un parent. Tu fournis une adresse e-mail valide, tu gardes ton mot de passe secret et tu es responsable de l’usage de ton compte. Tu peux le supprimer à tout moment dans les réglages.</p>
        <h4>4. Bon usage</h4>
        <p>Tu t’engages à utiliser le service de façon personnelle et légale : pas de tentative d’accès aux données d’autrui, pas de surcharge volontaire, pas de contenu illicite. L’éditeur peut suspendre un compte en cas d’abus.</p>
        <h4>5. Tes données</h4>
        <p>Tu restes propriétaire de ce que tu mets dans l’app. Tu autorises seulement l’éditeur à le stocker et à le synchroniser pour faire fonctionner le service. Fais des sauvegardes régulières (Réglages → Sauvegarde).</p>
        <h4>6. Santé et bien-être</h4>
        <p>Les fonctions de respiration, de sons et de « modulation neurale » sont proposées pour le confort ; ce ne sont pas des conseils médicaux et leur effet n’est pas garanti. Certains effets visuels clignotent : si tu es sensible à la lumière, active la réduction des animations dans ton système.</p>
        <h4>7. Responsabilité</h4>
        <p>Dans les limites permises par la loi, l’éditeur ne peut être tenu responsable des pertes de données, d’une indisponibilité du service ou des conséquences de son utilisation.</p>
        <h4>8. Propriété intellectuelle</h4>
        <p>Le code, les visuels et les textes de MerlinsLockIN appartiennent à leur éditeur. Les noms de Séquences font référence au roman « Lord of the Mysteries » de Cuttlefish That Loves Diving : il s’agit d’un clin d’œil de fan, sans lien ni partenariat avec l’auteur ou ses éditeurs.</p>
        <h4>9. Droit applicable</h4>
        <p>Ces conditions sont soumises au droit français. Contact : <b>${esc(EMAIL())}</b>.</p>`,
      notice: () => `
        <h4>Éditeur</h4>
        <p>MerlinsLockIN est édité à titre personnel et non commercial par « LostfromMerlinHermes ». Contact : <b>${esc(EMAIL())}</b>.</p>
        <h4>Hébergement du site</h4>
        <p>GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis (github.com). Adresse du site : ${esc(SITE)}</p>
        <h4>Hébergement des comptes et données</h4>
        <p>Supabase, Inc. (supabase.com), dans ${esc(REGION())}.</p>`,
    },
    en: {
      privacy: () => `
        <p>This policy explains what data MerlinsLockIN uses and how. MerlinsLockIN is a free personal project, with no ads, no tracking and no data sales.</p>
        <h4>Data controller</h4>
        <p>The publisher of MerlinsLockIN (pseudonym "LostfromMerlinHermes"), reachable at <b>${esc(EMAIL())}</b>.</p>
        <h4>Without an account</h4>
        <p>Everything stays on your device, in the browser’s local storage: tasks, sessions, calendar, journal, settings and progress. Nothing is sent to the publisher.</p>
        <h4>With an account</h4>
        <ul>
          <li><b>Data:</b> your email address, your password (stored encrypted by our provider, never readable by the publisher), the app content you put in it (tasks, notes, sessions, calendar, journal, settings, progress) and technical sign-in data (sign-in times, IP address in the provider’s logs).</li>
          <li><b>Why:</b> to create and secure your account and sync your data between your devices.</li>
          <li><b>Legal basis:</b> performing the service you ask for by creating an account (GDPR article 6(1)(b)).</li>
          <li><b>How long:</b> as long as your account exists. When you delete it, your data is erased immediately; the provider’s technical backups expire on their normal rotation.</li>
        </ul>
        <h4>Providers</h4>
        <ul>
          <li><b>Supabase Inc.</b> hosts accounts and synced data, in ${esc(REGION())}. Traffic is encrypted (HTTPS) and security rules stop each user from reading anyone else’s data.</li>
          <li><b>GitHub Inc.</b> hosts the website. Like any host, it may log visitors’ IP addresses.</li>
        </ul>
        <p>Fonts are hosted with the app: no requests go to Google. The local storage used is strictly necessary for the app to work; there are no advertising cookies and no analytics.</p>
        <h4>Your rights</h4>
        <p>You can access, correct, export (Settings → Backup → Download a file), object to or erase your data (Settings → Account → Delete my account). For any request: <b>${esc(EMAIL())}</b>. You can also complain to your data protection authority (in France, the CNIL: cnil.fr).</p>
        <h4>Minors</h4>
        <p>Accounts are for people aged 15 or older, or younger with a parent’s permission.</p>
        <h4>Changes</h4>
        <p>This policy may change; the update date is shown at the top.</p>`,
      terms: () => `
        <h4>1. Purpose</h4>
        <p>MerlinsLockIN is a free organisation and focus app (timer, planner, calendar, sounds, game). By using it you accept these terms.</p>
        <h4>2. Access</h4>
        <p>The service is provided free of charge, "as is", with no guarantee of availability or of being error-free. It may change, pause or stop at any time.</p>
        <h4>3. Account</h4>
        <p>To create an account you must be 15 or older, or have a parent’s permission. You give a valid email, keep your password secret and are responsible for your account’s use. You can delete it at any time in Settings.</p>
        <h4>4. Acceptable use</h4>
        <p>You agree to use the service personally and lawfully: no attempts to access others’ data, no deliberate overloading, no illegal content. The publisher may suspend an account in case of abuse.</p>
        <h4>5. Your data</h4>
        <p>You keep ownership of what you put in the app. You only allow the publisher to store and sync it to run the service. Back up regularly (Settings → Backup).</p>
        <h4>6. Health and wellbeing</h4>
        <p>Breathing, sound and "neural modulation" features are offered for comfort; they are not medical advice and their effect is not guaranteed. Some visual effects flash: if you are sensitive to light, turn on reduced motion in your system settings.</p>
        <h4>7. Liability</h4>
        <p>To the extent allowed by law, the publisher is not liable for data loss, service unavailability or the consequences of using the service.</p>
        <h4>8. Intellectual property</h4>
        <p>MerlinsLockIN’s code, visuals and texts belong to its publisher. The Sequence names refer to the novel "Lord of the Mysteries" by Cuttlefish That Loves Diving: a fan nod, with no link to or partnership with the author or publishers.</p>
        <h4>9. Governing law</h4>
        <p>These terms are governed by French law. Contact: <b>${esc(EMAIL())}</b>.</p>`,
      notice: () => `
        <h4>Publisher</h4>
        <p>MerlinsLockIN is published on a personal, non-commercial basis by "LostfromMerlinHermes". Contact: <b>${esc(EMAIL())}</b>.</p>
        <h4>Website hosting</h4>
        <p>GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA (github.com). Site address: ${esc(SITE)}</p>
        <h4>Accounts and data hosting</h4>
        <p>Supabase, Inc. (supabase.com), in ${esc(REGION())}.</p>`,
    },
  };

  const TITLE = { privacy: 'legal_privacy', terms: 'legal_terms', notice: 'legal_notice' };
  function openLegal(which) {
    let el = $('legal');
    if (!el) {
      el = document.createElement('div'); el.id = 'legal'; el.className = 'overlay legal-overlay';
      el.addEventListener('click', e => { if (e.target === el || e.target.closest('[data-close-legal]')) el.hidden = true; });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !el.hidden) el.hidden = true; });
      document.body.appendChild(el);
    }
    const lang = S.lang || ((navigator.language || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en');
    const d = new Date(LEGAL_VERSION + 'T12:00:00').toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    el.innerHTML = `<div class="sheet wide legal-sheet" role="dialog" aria-modal="true" aria-labelledby="legal-h">
      <div class="sheet-head"><h2 id="legal-h">${esc(t(TITLE[which]))}</h2>
        <button type="button" class="ghost icon-only" data-close-legal aria-label="${esc(t('close'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <p class="hint">${esc(t('legal_updated', { d }))}</p>
      <div class="legal-body">${DOCS[lang][which]()}</div>
      <div class="legal-links">${Object.keys(TITLE).filter(k => k !== which).map(k => `<button type="button" class="link" data-legal="${k}">${esc(t(TITLE[k]))}</button>`).join('')}</div>
    </div>`;
    el.querySelectorAll('[data-legal]').forEach(b => b.onclick = () => openLegal(b.dataset.legal));
    el.hidden = false;
    el.querySelector('.sheet').scrollTop = 0;
  }
  ML.openLegal = openLegal;
  ML.legalLinks = () => Object.keys(TITLE).map(k => `<button type="button" class="link" data-legal="${k}">${esc(t(TITLE[k]))}</button>`).join(' · ');
  document.addEventListener('click', e => { const b = e.target.closest('[data-legal]'); if (b && !b.closest('#legal')) openLegal(b.dataset.legal); });

  ML.settingsSection({
    order: 99,
    render: () => `<h3>${esc(t('legal_about'))}</h3><p class="hint">${esc(t('legal_about_p'))}</p><p class="legal-links">${ML.legalLinks()}</p>`,
  });
})();
