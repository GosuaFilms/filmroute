import type { jsPDF as JsPDF } from 'jspdf';
import type { FilmData, StrategyReport } from '../types/film';
import type { PosterImage } from '../lib/posters';
import { formatNumber, genreLabel } from './format';

type RGB = [number, number, number];

const C = {
  ink: [14, 14, 20] as RGB,
  inkSoft: [30, 29, 38] as RGB,
  inkLine: [44, 42, 52] as RGB,
  paper: [250, 247, 240] as RGB,
  text: [34, 32, 40] as RGB,
  muted: [112, 106, 100] as RGB,
  hair: [221, 212, 194] as RGB,
  gold: [168, 132, 52] as RGB,
  goldBright: [214, 178, 96] as RGB,
  goldPale: [241, 231, 205] as RGB,
  numeral: [226, 210, 168] as RGB,
  cream: [240, 234, 220] as RGB,
  green: [56, 120, 86] as RGB,
  red: [166, 64, 58] as RGB,
  amber: [178, 128, 36] as RGB,
  blue: [56, 94, 142] as RGB,
};

const FONT_BASE = 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf';
const FONTS = [
  { file: 'NotoSans-Regular.ttf', url: `${FONT_BASE}/NotoSans/NotoSans-Regular.ttf`, family: 'Sans', style: 'normal' },
  { file: 'NotoSans-Bold.ttf', url: `${FONT_BASE}/NotoSans/NotoSans-Bold.ttf`, family: 'Sans', style: 'bold' },
  { file: 'NotoSerifDisplay-Bold.ttf', url: `${FONT_BASE}/NotoSerifDisplay/NotoSerifDisplay-Bold.ttf`, family: 'Serif', style: 'bold' },
  { file: 'NotoSerifDisplay-Italic.ttf', url: `${FONT_BASE}/NotoSerifDisplay/NotoSerifDisplay-Italic.ttf`, family: 'Serif', style: 'italic' },
];

let fontCache: Promise<string[]> | null = null;

async function fetchFontBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

async function registerFonts(doc: JsPDF): Promise<boolean> {
  try {
    fontCache ??= Promise.all(FONTS.map(f => fetchFontBase64(f.url)));
    const data = await fontCache;
    FONTS.forEach((f, i) => {
      doc.addFileToVFS(f.file, data[i]);
      doc.addFont(f.file, f.family, f.style);
    });
    return true;
  } catch {
    fontCache = null;
    return false;
  }
}

const TYPE_LABELS: Record<string, string> = {
  cortometraje: 'Cortometraje',
  mediometraje: 'Mediometraje',
  largometraje: 'Largometraje',
  documental: 'Documental',
};

const TIER_LABELS: Record<string, string> = {
  tier_a: 'TIER A', tier_b: 'TIER B', tier_c: 'TIER C', nacional: 'NACIONAL', regional: 'REGIONAL',
};

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

// La IA a veces numera las fases ("Fase 2: …", "2. …"); el documento pone su propia numeración
function stripPhaseNumber(name: string): string {
  return name.replace(/^(fase\s*)?\d+\s*[:.\-–—)]\s*/i, '');
}

function splitLead(text: string): [string, string] {
  const match = text.match(/^(.{40,320}?[.!?])\s+(.*)$/s);
  return match ? [match[1], match[2]] : [text, ''];
}

export async function exportReportToPDF(report: StrategyReport, filmData?: FilmData, poster?: PosterImage | null): Promise<void> {
  const { jsPDF, GState } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const hasFonts = await registerFonts(doc);

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const ML = 22;
  const MR = 22;
  const CW = W - ML - MR;
  const TOP = 28;
  const BOTTOM = 24;
  let y = TOP;

  // ── Tipografía ──────────────────────────────────────────────────────────────
  const sans = (size: number) => { doc.setFont(hasFonts ? 'Sans' : 'helvetica', 'normal'); doc.setFontSize(size); };
  const sansBold = (size: number) => { doc.setFont(hasFonts ? 'Sans' : 'helvetica', 'bold'); doc.setFontSize(size); };
  const serif = (size: number) => { doc.setFont(hasFonts ? 'Serif' : 'times', 'bold'); doc.setFontSize(size); };
  const serifItalic = (size: number) => { doc.setFont(hasFonts ? 'Serif' : 'times', 'italic'); doc.setFontSize(size); };
  const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const lh = (size: number, factor = 1.45) => size * 0.3528 * factor;

  // Texto con espaciado entre letras; jsPDF no lo tiene en cuenta al alinear, así que se calcula aquí
  const spaced = (text: string, x: number, yy: number, cs: number, align: 'left' | 'right' | 'center' = 'left') => {
    const w = doc.getTextWidth(text) + cs * Math.max(text.length - 1, 0);
    const xx = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
    doc.text(text, xx, yy, { charSpace: cs });
  };

  const film = filmData?.basicInfo ?? {};
  const title = report.filmTitle || 'Sin título';

  // ── Páginas ────────────────────────────────────────────────────────────────
  const paintPaper = () => {
    fill(C.paper);
    doc.rect(0, 0, W, H, 'F');
    sansBold(6.5);
    color(C.gold);
    spaced('FILMROUTE', ML, 14, 1.4);
    serifItalic(8.5);
    color(C.muted);
    doc.text(title, W - MR, 14, { align: 'right' });
    stroke(C.hair);
    doc.setLineWidth(0.2);
    doc.line(ML, 17, W - MR, 17);
  };

  const newPage = () => {
    doc.addPage();
    paintPaper();
    y = TOP;
  };

  const ensure = (h: number) => {
    if (y + h > H - BOTTOM) newPage();
  };

  const wrap = (text: string, width: number): string[] => doc.splitTextToSize(text, width) as string[];

  // Escribe líneas pasando de página cuando hace falta; setFont se reaplica tras cada salto
  const writeLines = (lines: string[], x: number, size: number, setFont: () => void, c: RGB, factor = 1.45) => {
    const step = lh(size, factor);
    for (const line of lines) {
      if (y + step > H - BOTTOM) {
        newPage();
      }
      setFont();
      color(c);
      doc.text(line, x, y);
      y += step;
    }
  };

  const paragraph = (text: string, opts: { x?: number; width?: number; size?: number; c?: RGB; font?: 'sans' | 'italic' | 'serif' } = {}) => {
    const size = opts.size ?? 9;
    const setFont = () => (opts.font === 'italic' ? serifItalic(size) : opts.font === 'serif' ? serif(size) : sans(size));
    setFont();
    writeLines(wrap(text, opts.width ?? CW), opts.x ?? ML, size, setFont, opts.c ?? C.text);
  };

  const diamond = (x: number, yy: number, r: number, c: RGB) => {
    fill(c);
    doc.triangle(x - r, yy, x, yy - r, x + r, yy, 'F');
    doc.triangle(x - r, yy, x, yy + r, x + r, yy, 'F');
  };

  const bullets = (items: string[], opts: { x?: number; width?: number; size?: number; c?: RGB; marker?: RGB; gap?: number } = {}) => {
    const x = opts.x ?? ML;
    const width = opts.width ?? CW;
    const size = opts.size ?? 8.8;
    for (const item of items) {
      sans(size);
      const lines = wrap(item, width - 6);
      ensure(lh(size) + 1);
      diamond(x + 1.2, y - lh(size) * 0.32, 0.9, opts.marker ?? C.gold);
      writeLines(lines, x + 5, size, () => sans(size), opts.c ?? C.text);
      y += opts.gap ?? 1.4;
    }
  };

  let sectionNo = 0;
  const section = (heading: string, kicker?: string, keepWith = 0) => {
    sectionNo += 1;
    ensure(34 + keepWith);
    if (y > TOP + 2) y += 6;
    const num = String(sectionNo).padStart(2, '0');
    serif(30);
    color(C.numeral);
    doc.text(num, ML, y + 8);
    serif(19);
    color(C.text);
    doc.text(heading, ML + 19, y + 7);
    if (kicker) {
      sans(8);
      color(C.muted);
      doc.text(kicker, ML + 19, y + 13);
    }
    stroke(C.gold);
    doc.setLineWidth(0.6);
    doc.line(ML + 19, y + (kicker ? 16.5 : 11), ML + 37, y + (kicker ? 16.5 : 11));
    y += kicker ? 25 : 20;
  };

  // ── PORTADA ────────────────────────────────────────────────────────────────
  fill(C.ink);
  doc.rect(0, 0, W, H, 'F');

  // Bobina de película como motivo de fondo (el cartel ocupa su lugar si existe)
  if (!poster) {
  doc.setGState(new GState({ opacity: 0.45 }));
  stroke(C.inkLine);
  doc.setLineWidth(0.5);
  const reelX = W - 12;
  const reelY = 104;
  doc.circle(reelX, reelY, 62, 'S');
  doc.circle(reelX, reelY, 58, 'S');
  doc.circle(reelX, reelY, 9, 'S');
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    doc.circle(reelX + Math.cos(a) * 33, reelY + Math.sin(a) * 33, 13, 'S');
  }
  doc.setGState(new GState({ opacity: 1 }));
  }

  // Perforaciones de película en los márgenes
  fill(C.inkSoft);
  for (let py = 6; py < H - 6; py += 7.2) {
    doc.roundedRect(5, py, 4.2, 3.4, 0.7, 0.7, 'F');
    doc.roundedRect(W - 9.2, py, 4.2, 3.4, 0.7, 0.7, 'F');
  }
  stroke(C.inkLine);
  doc.setLineWidth(0.3);
  doc.line(12, 0, 12, H);
  doc.line(W - 12, 0, W - 12, H);

  const CL = 26;
  const CR = W - 26;
  sansBold(8.5);
  color(C.goldBright);
  spaced('FILMROUTE', CL, 32, 2.2);
  sans(7);
  color(C.muted);
  spaced('ESTRATEGIA DE DISTRIBUCIÓN', CR, 32, 1.2, 'right');
  stroke(C.goldBright);
  doc.setLineWidth(0.25);
  doc.line(CL, 37, CR, 37);

  // Cartel enmarcado a la derecha; el bloque de título se estrecha para dejarle sitio
  let textW = CR - CL;
  let kickerY = 112;
  if (poster) {
    const ratio = poster.height / poster.width;
    let pw = 70;
    let ph = pw * ratio;
    if (ph > 110) {
      ph = 110;
      pw = ph / ratio;
    }
    const px = CR - pw;
    const py = 52;
    fill([6, 6, 10]);
    doc.rect(px + 2.5, py + 2.5, pw, ph, 'F');
    doc.addImage(poster.dataUrl, 'JPEG', px, py, pw, ph);
    stroke(C.goldBright);
    doc.setLineWidth(0.3);
    doc.rect(px - 2, py - 2, pw + 4, ph + 4, 'S');
    textW = px - CL - 12;
    kickerY = 76;
  }

  sansBold(7.5);
  color(C.goldBright);
  spaced('DOSSIER DE DISTRIBUCIÓN', CL, kickerY, 2);
  stroke(C.goldBright);
  doc.setLineWidth(0.5);
  doc.line(CL, kickerY + 4, CL + 14, kickerY + 4);

  const titleSize = poster ? 30 : 36;
  serif(titleSize);
  color([246, 241, 229]);
  const titleLines = wrap(title, textW);
  let ty = kickerY + 20;
  for (const line of titleLines.slice(0, 4)) {
    doc.text(line, CL, ty);
    ty += titleSize * 0.39;
  }

  const metaParts = [
    film.filmType ? TYPE_LABELS[film.filmType] ?? capitalize(film.filmType) : '',
    film.genre ? capitalize(genreLabel(film.genre)) : '',
    film.duration ? `${film.duration} min` : '',
    film.country ?? '',
    film.productionYear ? String(film.productionYear) : '',
  ].filter(Boolean);
  if (metaParts.length > 0) {
    serifItalic(12.5);
    color(C.goldBright);
    const metaLines = wrap(metaParts.join('  ·  '), textW);
    doc.text(metaLines, CL, ty + 1, { lineHeightFactor: 1.35 });
    ty += 3 + metaLines.length * lh(12.5, 1.35);
  }
  if (film.directorName) {
    sans(9.5);
    color([196, 190, 178]);
    doc.text(wrap(`Un film de ${film.directorName}`, textW)[0], CL, ty + 2);
    ty += 6;
  }
  if (film.productionCompany) {
    sans(8.5);
    color(C.muted);
    doc.text(wrap(`Producción: ${film.productionCompany}`, textW)[0], CL, ty + 2);
  }

  // Anillo del índice de distribución
  const ringX = CL + 21;
  const ringY = 222;
  const ringR = 18;
  stroke(C.inkLine);
  doc.setLineWidth(1.6);
  doc.circle(ringX, ringY, ringR, 'S');
  const score = Math.max(0, Math.min(100, report.overallScore));
  stroke(C.goldBright);
  doc.setLineWidth(2.2);
  doc.setLineCap('round');
  const start = -Math.PI / 2;
  const end = start + (Math.PI * 2 * score) / 100;
  const steps = Math.max(2, Math.ceil((end - start) / 0.05));
  for (let i = 0; i < steps; i++) {
    const a1 = start + ((end - start) * i) / steps;
    const a2 = start + ((end - start) * (i + 1)) / steps;
    doc.line(ringX + Math.cos(a1) * ringR, ringY + Math.sin(a1) * ringR, ringX + Math.cos(a2) * ringR, ringY + Math.sin(a2) * ringR);
  }
  doc.setLineCap('butt');
  serif(24);
  color([246, 241, 229]);
  doc.text(String(score), ringX, ringY + 2.5, { align: 'center' });
  sans(6.5);
  color(C.muted);
  doc.text('/ 100', ringX, ringY + 8, { align: 'center' });
  sansBold(6);
  color(C.goldBright);
  spaced('ÍNDICE DE DISTRIBUCIÓN', ringX, ringY + ringR + 8, 1, 'center');

  // Cifras clave
  const figures: [string, string][] = [
    [String(report.recommendedFestivals.length), 'festivales seleccionados'],
    [String(report.marketingPhases.length), 'fases de lanzamiento'],
  ];
  if (report.totalBudgetEstimate > 0) figures.push([`${formatNumber(report.totalBudgetEstimate)} €`, 'presupuesto de distribución']);
  const figX = CL + 60;
  stroke(C.inkLine);
  doc.setLineWidth(0.3);
  doc.line(figX - 8, ringY - 20, figX - 8, ringY + 20);
  figures.forEach(([value, text], i) => {
    const fy = ringY - 12 + i * 14;
    serif(17);
    color(C.goldBright);
    doc.text(value, figX, fy);
    const vw = doc.getTextWidth(value);
    sans(8.5);
    color([196, 190, 178]);
    doc.text(text, figX + vw + 3, fy);
  });

  stroke(C.inkLine);
  doc.setLineWidth(0.25);
  doc.line(CL, H - 30, CR, H - 30);
  sans(7.5);
  color(C.muted);
  doc.text(`Generado el ${report.generatedAt}`, CL, H - 23);
  doc.text(report.aiGenerated ? 'Elaborado por el asesor IA de FilmRoute' : 'Elaborado con FilmRoute', CR, H - 23, { align: 'right' });
  sans(6.5);
  doc.text('Documento confidencial · Uso exclusivo del equipo del proyecto', CL, H - 18);

  // ── 01 RESUMEN EJECUTIVO ───────────────────────────────────────────────────
  newPage();
  section('Resumen ejecutivo', 'La estrategia de un vistazo');

  const [lead, rest] = splitLead(report.executiveSummary);
  stroke(C.gold);
  doc.setLineWidth(0.8);
  const leadStart = y - 4;
  paragraph(lead, { x: ML + 6, width: CW - 6, size: 13, font: 'italic', c: C.text });
  doc.line(ML, leadStart, ML, y - 3);
  y += 3;
  if (rest) {
    paragraph(rest, { size: 9.3, c: C.text });
    y += 3;
  }

  if (report.scoreRationale) {
    sans(8.5);
    const rLines = wrap(report.scoreRationale, CW - 16);
    const boxH = 13 + rLines.length * lh(8.5);
    ensure(boxH + 4);
    fill(C.goldPale);
    doc.roundedRect(ML, y, CW, boxH, 1.5, 1.5, 'F');
    fill(C.gold);
    doc.rect(ML, y, 1.2, boxH, 'F');
    sansBold(6.8);
    color(C.gold);
    spaced(`SOBRE EL ÍNDICE DE DISTRIBUCIÓN · ${score}/100`, ML + 8, y + 7, 1);
    sans(8.5);
    color(C.text);
    let ry = y + 13;
    for (const line of rLines) {
      doc.text(line, ML + 8, ry);
      ry += lh(8.5);
    }
    y += boxH + 6;
  }

  if (report.posterAnalysis) {
    const thumbW = poster ? 24 : 0;
    const tx = ML + (poster ? thumbW + 8 : 0);
    sans(8.6);
    const pLines = wrap(report.posterAnalysis, CW - (tx - ML));
    const textH = 7 + pLines.length * lh(8.6);
    const thumbH = poster ? thumbW * (poster.height / poster.width) : 0;
    ensure(Math.min(Math.max(textH, thumbH) + 6, 90));
    const top = y;
    if (poster) {
      doc.addImage(poster.dataUrl, 'JPEG', ML, top, thumbW, thumbH);
      stroke(C.hair);
      doc.setLineWidth(0.2);
      doc.rect(ML, top, thumbW, thumbH, 'S');
    }
    sansBold(6.8);
    color(C.gold);
    spaced('EL CARTEL', tx, top + 3, 1.1);
    y = top + 8.5;
    writeLines(pLines, tx, 8.6, () => sans(8.6), C.text);
    y = Math.max(y, top + thumbH) + 8;
  }

  // Fila de cifras
  const kpis: [string, string][] = [
    [`${score}`, 'Índice / 100'],
    [String(report.recommendedFestivals.length), 'Festivales'],
    [String(report.marketingPhases.length), 'Fases'],
    [report.totalBudgetEstimate > 0 ? `${formatNumber(report.totalBudgetEstimate)} €` : '—', 'Presupuesto'],
  ];
  ensure(26);
  const kw = CW / kpis.length;
  stroke(C.hair);
  doc.setLineWidth(0.25);
  doc.line(ML, y, ML + CW, y);
  doc.line(ML, y + 22, ML + CW, y + 22);
  kpis.forEach(([value, text], i) => {
    const kx = ML + kw * i + kw / 2;
    if (i > 0) doc.line(ML + kw * i, y + 4, ML + kw * i, y + 18);
    serif(17);
    color(C.gold);
    doc.text(value, kx, y + 12, { align: 'center' });
    sansBold(6.2);
    color(C.muted);
    spaced(text.toUpperCase(), kx, y + 17.5, 0.8, 'center');
  });
  y += 30;

  // ── 02 DAFO ────────────────────────────────────────────────────────────────
  section('Análisis DAFO', 'Fortalezas, debilidades, oportunidades y riesgos del proyecto');
  const dafo: [string, string[], RGB][] = [
    ['Fortalezas', report.strengths, C.green],
    ['Debilidades', report.weaknesses.length ? report.weaknesses : ['No se detectaron debilidades críticas.'], C.red],
    ['Oportunidades', report.opportunities, C.blue],
    ['Riesgos', report.risks, C.amber],
  ];
  for (const [name, items, c] of dafo) {
    ensure(22);
    fill(c);
    doc.rect(ML, y - 4.2, 2.4, 5.2, 'F');
    serif(13.5);
    color(c);
    doc.text(name, ML + 6, y);
    sans(7.5);
    color(C.muted);
    doc.text(`${items.length} ${items.length === 1 ? 'punto' : 'puntos'}`, ML + CW, y, { align: 'right' });
    y += 3;
    stroke(C.hair);
    doc.setLineWidth(0.2);
    doc.line(ML, y, ML + CW, y);
    y += 5.5;
    bullets(items, { marker: c });
    y += 5;
  }

  // ── 03 FESTIVALES ──────────────────────────────────────────────────────────
  section('Festivales recomendados', `${report.recommendedFestivals.length} festivales seleccionados para esta película, por orden de prioridad`);
  report.recommendedFestivals.forEach((f, i) => {
    const textX = ML + 26;
    const textW = CW - 26;
    sans(8.5);
    const reasonLines = wrap(f.reason, textW);
    const cardH = 18 + reasonLines.length * lh(8.5);
    ensure(Math.min(cardH, 60));

    serif(18);
    color(C.numeral);
    doc.text(String(i + 1).padStart(2, '0'), ML, y + 5);

    const tier = TIER_LABELS[f.tier] ?? f.tier.toUpperCase();
    const tierStyle: [RGB, RGB] = f.tier === 'tier_a' ? [C.gold, C.paper] : f.tier === 'tier_b' ? [C.goldPale, C.gold] : [C.cream, C.muted];
    sansBold(5.6);
    const tw = doc.getTextWidth(tier) + 5;
    fill(tierStyle[0]);
    doc.roundedRect(ML, y + 8, tw, 4.4, 1, 1, 'F');
    color(tierStyle[1]);
    doc.text(tier, ML + 2.5, y + 11.2);

    serif(12.5);
    color(C.text);
    doc.text(f.name, textX, y + 3);
    sans(7.6);
    color(C.muted);
    doc.text([f.country, f.city, f.month].filter(Boolean).join('  ·  '), textX, y + 8);
    sansBold(7.2);
    color(C.gold);
    const facts = [`Deadline: ${f.deadline}`, `Tasa: ${f.submissionFee}`, f.platform ? `Vía: ${f.platform}` : ''].filter(Boolean).join('     ');
    doc.text(wrap(facts, textW)[0], textX, y + 12.5);
    y += 18;
    writeLines(reasonLines, textX, 8.5, () => sans(8.5), C.text);
    y += 3;
    stroke(C.hair);
    doc.setLineWidth(0.2);
    doc.line(textX, y, ML + CW, y);
    y += 6;
  });

  // ── 04 CALENDARIO ──────────────────────────────────────────────────────────
  if (report.festivalRoadmap.length > 0) {
    section('Calendario del circuito', 'Meses de celebración de los festivales seleccionados');
    const lineX = ML + 24;
    report.festivalRoadmap.forEach((m, i) => {
      sans(8.8);
      const lines = wrap(m.festivals.join('  ·  '), CW - 32);
      const rowH = Math.max(8, lines.length * lh(8.8) + 3);
      ensure(rowH + 2);
      const isLast = i === report.festivalRoadmap.length - 1;
      stroke(C.hair);
      doc.setLineWidth(0.4);
      if (!isLast) doc.line(lineX, y - 1, lineX, y - 1 + rowH + 2);
      fill(C.gold);
      doc.circle(lineX, y - 1.2, 1.5, 'F');
      fill(C.paper);
      doc.circle(lineX, y - 1.2, 0.6, 'F');
      sansBold(7.5);
      color(C.gold);
      spaced(m.month.toUpperCase(), lineX - 5, y, 0.8, 'right');
      writeLines(lines, lineX + 6, 8.8, () => sans(8.8), C.text);
      y += rowH - lines.length * lh(8.8) + 2;
    });
    y += 2;
  }

  // ── 05 PLATAFORMAS ─────────────────────────────────────────────────────────
  if (report.recommendedPlatforms.length > 0) {
    section('Plataformas', 'Vías de distribución digital y su accesibilidad para este proyecto');
    const probColor = (p: string): RGB => {
      const v = p.toLowerCase();
      if (v.startsWith('alta')) return C.green;
      if (v.startsWith('baja')) return C.red;
      return C.amber;
    };
    for (const p of report.recommendedPlatforms) {
      sans(7.8);
      const noteLines = wrap(p.notes, CW - 62);
      ensure(Math.max(16, noteLines.length * lh(7.8) + 6));
      serif(11);
      color(C.text);
      doc.text(p.name, ML, y);
      sansBold(5.8);
      color(C.muted);
      spaced(wrap(`${p.type.toUpperCase()}  ·  ${p.territory.toUpperCase()}`, 44)[0], ML, y + 4.5, 0.5);
      const pc = probColor(p.probability);
      fill(pc);
      doc.circle(ML + 1, y + 8.8, 0.9, 'F');
      sansBold(7);
      color(pc);
      doc.text(p.probability.replace(/\s*\(.*\)$/, ''), ML + 3.5, y + 9.6);
      const ny = y;
      y = ny - 0.5;
      writeLines(noteLines, ML + 62, 7.8, () => sans(7.8), C.muted);
      y = Math.max(y, ny + 13);
      stroke(C.hair);
      doc.setLineWidth(0.2);
      doc.line(ML, y, ML + CW, y);
      y += 6;
    }
  }

  // ── 06 VENTANAS ────────────────────────────────────────────────────────────
  section('Ventanas de distribución', 'Secuencia recomendada de explotación');
  report.distributionWindows.forEach((w, i) => {
    const RX = ML + 68;
    const RW = CW - 68;
    sans(8);
    const notes = wrap(w.notes, RW);
    sans(7.6);
    const platformLines = wrap(w.platform, 50).slice(0, 2);
    serif(11);
    const nameLines = wrap(w.window, 52).slice(0, 2);
    const leftH = nameLines.length * lh(11, 1.2) + 5 + platformLines.length * lh(7.6, 1.3);
    const rowH = Math.max(leftH, 5 + notes.length * lh(8)) + 3;
    ensure(rowH);
    fill(C.goldPale);
    doc.circle(ML + 4, y - 1, 4, 'F');
    serif(9);
    color(C.gold);
    doc.text(String(i + 1), ML + 4, y + 0.6, { align: 'center' });
    const ny = y;
    serif(11);
    color(C.text);
    doc.text(nameLines, ML + 12, y, { lineHeightFactor: 1.2 });
    let ly = y + (nameLines.length - 1) * lh(11, 1.2) + 5;
    sansBold(7.2);
    color(C.gold);
    doc.text(w.timing, ML + 12, ly);
    ly += 4.5;
    sans(7.6);
    color(C.muted);
    doc.text(platformLines, ML + 12, ly, { lineHeightFactor: 1.3 });
    sansBold(7.6);
    color(C.text);
    doc.text(wrap(w.revenue, RW)[0], RX, y);
    y = ny + 5;
    writeLines(notes, RX, 8, () => sans(8), C.muted);
    y = Math.max(y, ny + rowH - 3);
    stroke(C.hair);
    doc.setLineWidth(0.2);
    doc.line(ML + 12, y, ML + CW, y);
    y += 6;
  });

  // ── 07 PLAN DE LANZAMIENTO ─────────────────────────────────────────────────
  if (report.marketingPhases.length > 0) {
    section('Plan de lanzamiento', 'Fases, acciones e indicadores de éxito');
    report.marketingPhases.forEach((phase, i) => {
      ensure(40);
      const textX = ML + 22;
      const textW = CW - 22;
      serif(40);
      color(C.numeral);
      doc.text(String(i + 1), ML + 1, y + 12);
      serif(13.5);
      const nameLines = wrap(stripPhaseNumber(phase.phase), textW);
      writeLines(nameLines, textX, 13.5, () => serif(13.5), C.text, 1.3);
      sansBold(7.2);
      const metaLines = wrap(`${phase.duration}   ·   ${phase.budget}`, textW);
      writeLines(metaLines, textX, 7.2, () => sansBold(7.2), C.gold);
      y += 3;
      sansBold(6.5);
      color(C.muted);
      spaced('ACCIONES', textX, y, 1.1);
      y += 4.5;
      bullets(phase.actions, { x: textX, width: textW, size: 8.5, gap: 1 });
      if (phase.kpis.length > 0) {
        y += 2;
        ensure(10);
        sansBold(6.5);
        color(C.muted);
        spaced('INDICADORES DE ÉXITO', textX, y, 1.1);
        y += 4.5;
        bullets(phase.kpis, { x: textX, width: textW, size: 8.2, c: C.muted, marker: C.green, gap: 0.8 });
      }
      y += 7;
    });
  }

  // ── 08 ENTREGABLES ─────────────────────────────────────────────────────────
  section('Entregables', 'Estado de los materiales necesarios para la distribución', 30);
  const statusDot = (x: number, yy: number, status: string) => {
    if (status === 'listo') {
      fill(C.green);
      doc.circle(x, yy, 1.4, 'F');
    } else if (status === 'en_proceso') {
      stroke(C.amber);
      doc.setLineWidth(0.5);
      doc.circle(x, yy, 1.3, 'S');
      fill(C.amber);
      doc.triangle(x, yy - 1.3, x, yy + 1.3, x + 1.3, yy, 'F');
    } else {
      stroke(C.red);
      doc.setLineWidth(0.5);
      doc.circle(x, yy, 1.3, 'S');
    }
  };
  ensure(10);
  [['listo', 'Listo'], ['en_proceso', 'En proceso'], ['no_disponible', 'Pendiente']].forEach(([s, t], i) => {
    const lx = ML + i * 30;
    statusDot(lx + 1.4, y - 1, s);
    sans(7.5);
    color(C.muted);
    doc.text(t, lx + 4.5, y);
  });
  y += 8;
  const colW = (CW - 10) / 2;
  const items = report.deliverableChecklist;
  for (let i = 0; i < items.length; i += 2) {
    const pair = items.slice(i, i + 2);
    const heights = pair.map(it => {
      sans(8.2);
      return wrap(it.item, colW - 22).length * lh(8.2) + 7;
    });
    const rowH = Math.max(...heights);
    ensure(rowH);
    pair.forEach((it, j) => {
      const cx = ML + j * (colW + 10);
      statusDot(cx + 1.4, y - 1, it.status);
      sans(8.2);
      color(C.text);
      const lines = wrap(it.item, colW - 22);
      doc.text(lines, cx + 5, y);
      const pc = it.priority === 'alta' ? C.red : it.priority === 'media' ? C.amber : C.green;
      sansBold(5.8);
      color(pc);
      spaced(it.priority.toUpperCase(), cx + colW, y, 0.6, 'right');
      sans(6.8);
      color(C.muted);
      doc.text(it.deadline, cx + 5, y + lines.length * lh(8.2) + 0.5);
    });
    y += rowH;
    stroke(C.hair);
    doc.setLineWidth(0.15);
    doc.line(ML, y - 3, ML + CW, y - 3);
    y += 2;
  }

  // ── 09 PRESUPUESTO ─────────────────────────────────────────────────────────
  if (report.totalBudgetEstimate > 0 && report.budgetBreakdown.length > 0) {
    section('Inversión recomendada', `Reparto orientativo de ${formatNumber(report.totalBudgetEstimate)} € de presupuesto de distribución`);
    const maxPct = Math.max(...report.budgetBreakdown.map(b => b.percentage), 1);
    const labelW = 72;
    const barW = CW - labelW - 34;
    for (const b of report.budgetBreakdown) {
      ensure(10);
      sans(8.5);
      color(C.text);
      doc.text(wrap(b.category, labelW - 4)[0], ML, y);
      fill(C.cream);
      doc.roundedRect(ML + labelW, y - 3, barW, 3.6, 1.8, 1.8, 'F');
      fill(C.gold);
      doc.roundedRect(ML + labelW, y - 3, Math.max(3.6, (barW * b.percentage) / maxPct), 3.6, 1.8, 1.8, 'F');
      sansBold(8.2);
      color(C.text);
      doc.text(`${formatNumber(b.recommended)} €`, ML + CW - 9, y, { align: 'right' });
      sans(7);
      color(C.muted);
      doc.text(`${b.percentage}%`, ML + CW, y, { align: 'right' });
      y += 8.5;
    }
    ensure(12);
    stroke(C.gold);
    doc.setLineWidth(0.4);
    doc.line(ML, y - 3, ML + CW, y - 3);
    y += 3;
    serif(12);
    color(C.text);
    doc.text('Total', ML, y);
    serif(14);
    color(C.gold);
    doc.text(`${formatNumber(report.totalBudgetEstimate)} €`, ML + CW, y, { align: 'right' });
    y += 8;
  }

  // ── 10 PRÓXIMOS PASOS ──────────────────────────────────────────────────────
  section('Próximos pasos', 'Acciones inmediatas, por orden de urgencia');
  report.nextSteps.forEach((step, i) => {
    sans(9.2);
    const lines = wrap(step, CW - 16);
    ensure(Math.min(lines.length * lh(9.2) + 8, 40));
    serif(20);
    color(C.gold);
    doc.text(String(i + 1), ML + 4, y + 2.5, { align: 'center' });
    writeLines(lines, ML + 14, 9.2, () => sans(9.2), C.text);
    y += 5;
  });

  // ── CONTRAPORTADA ──────────────────────────────────────────────────────────
  doc.addPage();
  fill(C.ink);
  doc.rect(0, 0, W, H, 'F');
  fill(C.inkSoft);
  for (let py = 6; py < H - 6; py += 7.2) {
    doc.roundedRect(5, py, 4.2, 3.4, 0.7, 0.7, 'F');
    doc.roundedRect(W - 9.2, py, 4.2, 3.4, 0.7, 0.7, 'F');
  }
  stroke(C.goldBright);
  doc.setLineWidth(0.5);
  doc.line(W / 2 - 10, H / 2 - 22, W / 2 + 10, H / 2 - 22);
  serif(30);
  color(C.goldBright);
  doc.text('FilmRoute', W / 2, H / 2 - 6, { align: 'center' });
  serifItalic(11);
  color([196, 190, 178]);
  doc.text('Cada película merece encontrar a su público.', W / 2, H / 2 + 4, { align: 'center' });
  sansBold(8);
  color(C.goldBright);
  spaced('WWW.FILMROUTE.AI', W / 2, H / 2 + 16, 1.6, 'center');
  sans(6.8);
  color(C.muted);
  const disclaimer = wrap(
    'Este informe es una recomendación orientativa elaborada a partir de los datos facilitados. Plazos, tasas y requisitos de los festivales y plataformas pueden cambiar: verifícalos siempre en sus fuentes oficiales. FilmRoute no garantiza selecciones, ventas ni ingresos.',
    120,
  );
  doc.text(disclaimer, W / 2, H - 40, { align: 'center' });
  doc.text(`© ${new Date().getFullYear()} FilmRoute · LUR Atlantik Films`, W / 2, H - 22, { align: 'center' });

  // ── Pies de página (todas menos portada y contraportada) ───────────────────
  const total = doc.getNumberOfPages();
  for (let p = 2; p < total; p++) {
    doc.setPage(p);
    stroke(C.hair);
    doc.setLineWidth(0.2);
    doc.line(ML, H - 14, W - MR, H - 14);
    sans(7);
    color(C.muted);
    doc.text('Dossier de distribución', ML, H - 9);
    sansBold(7);
    color(C.gold);
    doc.text(`${p - 1} / ${total - 2}`, W - MR, H - 9, { align: 'right' });
  }

  const filename = `FilmRoute_${title.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '_')}.pdf`;
  doc.save(filename);
}
