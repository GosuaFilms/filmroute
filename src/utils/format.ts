// toLocaleString('es-ES') no agrupa los números de 4 cifras (7500 vs 12.000), así que se agrupa a mano
export function formatNumber(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatEuro(n: number): string {
  return `${formatNumber(n)} €`;
}

const GENRE_LABELS: Record<string, string> = {
  drama: 'drama',
  comedia: 'comedia',
  thriller: 'thriller',
  terror: 'terror',
  ciencia_ficcion: 'ciencia ficción',
  animacion: 'animación',
  documental_social: 'documental social',
  documental_naturaleza: 'documental de naturaleza',
  documental_historico: 'documental histórico',
  romance: 'romance',
  aventura: 'aventura',
  fantasia: 'fantasía',
  experimental: 'cine experimental',
  musical: 'musical',
  biopic: 'biopic',
  noir: 'noir',
  western: 'western',
  otro: 'otro género',
};

export function genreLabel(genre: string): string {
  return GENRE_LABELS[genre] ?? genre.replace(/_/g, ' ');
}
