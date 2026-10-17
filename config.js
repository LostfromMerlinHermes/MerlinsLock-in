// Supabase project used for accounts and cloud sync. The anon key is public by design:
// row-level security on the lockin_data table limits each user to their own row.
// Leave both empty to run without accounts (everything stays on the device).
window.MLI_CONFIG = {
  supabaseUrl: 'https://jwftgajswyjasmnsjigd.supabase.co',
  supabaseKey: 'sb_publishable_ah5OWrKxgIKqDulBK66DbA_NPjfBDye',
};
