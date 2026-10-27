// Supabase project used for accounts and cloud sync. The anon key is public by design:
// row-level security on the lockin_data table limits each user to their own row.
// Leave both empty to run without accounts (everything stays on the device).
window.MLI_CONFIG = {
  supabaseUrl: 'https://jwftgajswyjasmnsjigd.supabase.co',
  supabaseKey: 'sb_publishable_ah5OWrKxgIKqDulBK66DbA_NPjfBDye',
  // The web app: email links (account confirmation, password reset) open it when they can't come back to the current page
  // (extension, localhost). It must be listed in Supabase → Authentication → URL Configuration → Redirect URLs.
  appUrl: 'https://lostfrommerlinhermes.github.io/MerlinsLock-in/',
  // Shown in the privacy policy, terms and legal notice (legal.js)
  contactEmail: 'merlinslockin@gmail.com',
  // Supabase project region: eu-central-1
  dataRegion: { fr: 'l’Union européenne (Francfort, Allemagne)', en: 'the European Union (Frankfurt, Germany)' },
};
