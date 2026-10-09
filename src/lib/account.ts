import { supabase } from './supabase';

const POSTERS_BUCKET = 'posters';

// Copia de los datos del usuario en JSON (derecho de portabilidad, art. 20 RGPD)
export async function exportMyData(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const [strategies, submissions] = await Promise.all([
    supabase.from('strategies').select('*').order('created_at', { ascending: true }),
    supabase.from('submissions').select('*').order('created_at', { ascending: true }),
  ]);
  if (strategies.error || submissions.error) throw new Error('No se pudieron leer tus datos');

  const payload = {
    exportedAt: new Date().toISOString(),
    account: {
      email: user.email,
      fullName: user.user_metadata?.full_name ?? null,
      createdAt: user.created_at,
      termsVersion: user.user_metadata?.terms_version ?? null,
      termsAcceptedAt: user.user_metadata?.terms_accepted_at ?? null,
    },
    strategies: strategies.data,
    submissions: submissions.data,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `filmroute-mis-datos-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Borra los carteles (Storage no se limpia en cascada) y después la cuenta con todos sus datos
export async function deleteMyAccount(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const storage = supabase.storage.from(POSTERS_BUCKET);
  for (let round = 0; round < 50; round++) {
    const { data: files, error } = await storage.list(user.id, { limit: 100 });
    if (error) throw new Error('No se pudieron borrar tus carteles. Inténtalo de nuevo.');
    if (!files || files.length === 0) break;
    const { error: removeError } = await storage.remove(files.map(f => `${user.id}/${f.name}`));
    if (removeError) throw new Error('No se pudieron borrar tus carteles. Inténtalo de nuevo.');
  }

  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw new Error('No se pudo eliminar la cuenta. Inténtalo de nuevo o escríbenos.');

  // La sesión ya no es válida en el servidor; se limpia solo en este navegador
  await supabase.auth.signOut({ scope: 'local' });
}
