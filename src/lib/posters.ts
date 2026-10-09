import { supabase } from './supabase';

const BUCKET = 'posters';
const MAX_SIDE = 1600;
export const ACCEPTED_POSTER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_POSTER_MB = 20;

export interface PosterImage {
  dataUrl: string;
  width: number;
  height: number;
}

// Se reduce y se convierte a JPEG en el navegador: sube rápido y cabe en los límites de la IA y del PDF
async function resizeToJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen'))), 'image/jpeg', 0.86);
  });
}

export async function uploadPoster(file: File): Promise<string> {
  if (!ACCEPTED_POSTER_TYPES.includes(file.type)) throw new Error('Formato no admitido. Usa JPG, PNG o WebP.');
  if (file.size > MAX_POSTER_MB * 1024 * 1024) throw new Error(`La imagen supera los ${MAX_POSTER_MB} MB.`);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const blob = await resizeToJpeg(file);
  const path = `${user.id}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error('No se pudo subir el cartel. Inténtalo de nuevo.');
  return path;
}

export async function deletePoster(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}

export async function getPosterUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function getPosterUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60);
  const urls: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls[item.path] = item.signedUrl;
  }
  return urls;
}

export async function loadPosterImage(path: string): Promise<PosterImage | null> {
  const { data: blob } = await supabase.storage.from(BUCKET).download(path);
  if (!blob) return null;
  const bitmap = await createImageBitmap(blob);
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  return { dataUrl, ...size };
}
