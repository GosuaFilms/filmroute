import type { Materials, FilmData } from '../../types/film';
import { SectionCard } from '../ui/SectionCard';
import { MaterialStatusSelect } from '../ui/MaterialStatusSelect';
import { Select } from '../ui/Select';
import { AlertTriangle, Info } from 'lucide-react';

interface Props {
  data: Partial<Materials>;
  onChange: (data: Partial<FilmData>) => void;
}

const ASPECT_RATIOS = [
  { value: '1.85:1', label: '1.85:1 (Flat)' },
  { value: '2.39:1', label: '2.39:1 (Scope / CinemaScope)' },
  { value: '1.78:1', label: '1.78:1 (16:9)' },
  { value: '1.33:1', label: '1.33:1 (4:3 / Academy)' },
  { value: '1.43:1', label: '1.43:1 (IMAX)' },
  { value: '2.20:1', label: '2.20:1 (70mm)' },
  { value: '1.00:1', label: '1:1 (Cuadrado)' },
  { value: 'otro', label: 'Otro' },
];

const AUDIO_FORMATS = [
  { value: '5.1', label: 'Dolby 5.1 Surround' },
  { value: '7.1', label: 'Dolby 7.1' },
  { value: 'atmos', label: 'Dolby Atmos' },
  { value: 'stereo', label: 'Estéreo' },
  { value: 'mono', label: 'Mono' },
];

type BoolKey = 'musicRightsCleared' | 'archiveFootageCleared' | 'dcpEncrypted';
type StatusKey = Exclude<keyof Materials, BoolKey | 'aspectRatio' | 'audioFormat'>;

export function Step3Materials({ data, onChange }: Props) {
  const updateStatus = (field: StatusKey, value: Materials[StatusKey]) => {
    onChange({ materials: { ...data, [field]: value } });
  };
  const updateBool = (field: BoolKey, value: boolean) => {
    onChange({ materials: { ...data, [field]: value } });
  };
  const updateField = (field: 'aspectRatio' | 'audioFormat', value: string) => {
    onChange({ materials: { ...data, [field]: value } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-cinema-text mb-1">Materiales y entregables</h2>
        <p className="text-cinema-text-dim text-sm">El estado de tus materiales determina qué estrategias son viables ahora mismo.</p>
      </div>

      <div className="flex items-start gap-3 bg-cinema-blue/20 border border-cinema-blue-light/30 rounded-xl p-4">
        <Info size={18} className="text-cinema-blue-light mt-0.5 flex-shrink-0" />
        <p className="text-sm text-cinema-text-dim">
          Marca cada material como <span className="text-green-400 font-medium">Listo</span>, <span className="text-yellow-400 font-medium">En proceso</span> o <span className="text-red-400 font-medium">No disponible</span>. Esto permite calcular qué festivales y ventanas de distribución son accesibles hoy.
        </p>
      </div>

      <SectionCard title="Másters técnicos" description="Archivos de vídeo en alta calidad para distribución">
        <div className="space-y-0">
          {([
            { key: 'dcp' as StatusKey, label: 'DCP (Digital Cinema Package) — obligatorio para proyección en salas' },
            { key: 'proRes' as StatusKey, label: 'ProRes / Master HD (1080p o 4K) — para plataformas digitales' },
            { key: 'h264' as StatusKey, label: 'H.264 / MP4 (comprimido) — para screeners online y festivales digitales' },
          ]).map(item => (
            <MaterialStatusSelect
              key={item.key}
              label={item.label}
              value={data[item.key]}
              onChange={v => updateStatus(item.key, v)}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Select
            label="Relación de aspecto (Aspect Ratio)"
            options={ASPECT_RATIOS}
            value={data.aspectRatio ?? ''}
            onChange={e => updateField('aspectRatio', e.target.value)}
            placeholder="Selecciona"
          />
          <Select
            label="Formato de audio"
            options={AUDIO_FORMATS}
            value={data.audioFormat ?? ''}
            onChange={e => updateField('audioFormat', e.target.value)}
            placeholder="Selecciona"
          />
        </div>
        <label className="flex items-center gap-3 cursor-pointer mt-4">
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${data.dcpEncrypted ? 'bg-cinema-gold border-cinema-gold' : 'border-cinema-border'}`}
            onClick={() => updateBool('dcpEncrypted', !data.dcpEncrypted)}
          >
            {data.dcpEncrypted && (
              <svg className="w-3 h-3 text-cinema-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm text-cinema-text-dim" onClick={() => updateBool('dcpEncrypted', !data.dcpEncrypted)}>
            El DCP está encriptado (requiere KDM para cada cine)
          </span>
        </label>
      </SectionCard>

      <SectionCard title="Material promocional" description="Elementos de comunicación y marketing">
        <div className="space-y-0">
          {([
            { key: 'trailerTeaser' as StatusKey, label: 'Teaser (30–90 seg) — primer material de hype' },
            { key: 'trailerTheatrical' as StatusKey, label: 'Tráiler oficial (1:30–2:30 min) — para prensa y plataformas' },
            { key: 'poster' as StatusKey, label: 'Póster oficial (versión print + digital)' },
            { key: 'pressKit' as StatusKey, label: 'Press kit / EPK (dossier de prensa completo)' },
            { key: 'photoSet' as StatusKey, label: 'Fotografías de producción (mínimo 20 imágenes HQ)' },
            { key: 'bts' as StatusKey, label: 'Material BTS / Making of / Contenido extra' },
          ]).map(item => (
            <MaterialStatusSelect
              key={item.key}
              label={item.label}
              value={data[item.key]}
              onChange={v => updateStatus(item.key, v)}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Versiones lingüísticas y subtítulos">
        <div className="space-y-0">
          {([
            { key: 'subtitleFiles' as StatusKey, label: 'Archivos de subtítulos (SRT/VTT) en inglés y otros idiomas' },
          ]).map(item => (
            <MaterialStatusSelect
              key={item.key}
              label={item.label}
              value={data[item.key]}
              onChange={v => updateStatus(item.key, v)}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Presencia digital">
        <div className="space-y-0">
          {([
            { key: 'website' as StatusKey, label: 'Página web oficial de la película' },
            { key: 'socialMedia' as StatusKey, label: 'Perfiles en redes sociales (Instagram, X/Twitter, etc.)' },
          ]).map(item => (
            <MaterialStatusSelect
              key={item.key}
              label={item.label}
              value={data[item.key]}
              onChange={v => updateStatus(item.key, v)}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Derechos y clearances">
        <div className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 mb-4">
          <AlertTriangle size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-cinema-text-dim">
            Los derechos sin resolver pueden bloquear la distribución en plataformas internacionales. Es fundamental resolverlos antes de negociar con plataformas.
          </p>
        </div>
        <div className="space-y-3">
          {([
            { key: 'musicRightsCleared' as BoolKey, label: 'Derechos de música clarificados (composiciones y masters)' },
            { key: 'archiveFootageCleared' as BoolKey, label: 'Material de archivo con derechos resueltos (si aplica)' },
          ]).map(item => (
            <label key={item.key} className="flex items-center gap-3 cursor-pointer group py-2 border-b border-cinema-border last:border-0">
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${data[item.key] ? 'bg-green-500 border-green-500' : 'border-cinema-border group-hover:border-cinema-gold/60'}`}
                onClick={() => updateBool(item.key, !data[item.key])}
              >
                {data[item.key] && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-cinema-text" onClick={() => updateBool(item.key, !data[item.key])}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
