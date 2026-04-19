import type { BasicInfo, FilmData } from '../../types/film';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { SectionCard } from '../ui/SectionCard';
import { CheckboxGroup } from '../ui/CheckboxGroup';

interface Props {
  data: Partial<BasicInfo>;
  onChange: (data: Partial<FilmData>) => void;
}

const FILM_TYPES = [
  { value: 'cortometraje', label: 'Cortometraje (hasta 30 min)' },
  { value: 'mediometraje', label: 'Mediometraje (30–60 min)' },
  { value: 'largometraje', label: 'Largometraje (más de 60 min)' },
  { value: 'documental', label: 'Documental' },
];

const GENRES = [
  { value: 'drama', label: 'Drama' },
  { value: 'comedia', label: 'Comedia' },
  { value: 'thriller', label: 'Thriller / Suspense' },
  { value: 'terror', label: 'Terror / Horror' },
  { value: 'ciencia_ficcion', label: 'Ciencia Ficción' },
  { value: 'animacion', label: 'Animación' },
  { value: 'documental_social', label: 'Documental Social' },
  { value: 'documental_naturaleza', label: 'Documental Naturaleza' },
  { value: 'documental_historico', label: 'Documental Histórico' },
  { value: 'romance', label: 'Romance' },
  { value: 'aventura', label: 'Aventura' },
  { value: 'fantasia', label: 'Fantasía' },
  { value: 'experimental', label: 'Experimental / Videoarte' },
  { value: 'musical', label: 'Musical' },
  { value: 'biopic', label: 'Biopic' },
  { value: 'noir', label: 'Noir' },
  { value: 'western', label: 'Western' },
  { value: 'otro', label: 'Otro' },
];

const LANGUAGES = [
  { value: 'español', label: 'Español' },
  { value: 'catalan', label: 'Catalán' },
  { value: 'euskera', label: 'Euskera' },
  { value: 'gallego', label: 'Gallego' },
  { value: 'ingles', label: 'Inglés' },
  { value: 'frances', label: 'Francés' },
  { value: 'aleman', label: 'Alemán' },
  { value: 'italiano', label: 'Italiano' },
  { value: 'portugues', label: 'Portugués' },
  { value: 'arabe', label: 'Árabe' },
  { value: 'otro', label: 'Otro' },
];

const SUBTITLE_OPTIONS = [
  { value: 'español', label: 'Español' },
  { value: 'ingles', label: 'Inglés' },
  { value: 'frances', label: 'Francés' },
  { value: 'aleman', label: 'Alemán' },
  { value: 'italiano', label: 'Italiano' },
  { value: 'portugues', label: 'Portugués' },
  { value: 'chino', label: 'Chino' },
  { value: 'japones', label: 'Japonés' },
  { value: 'arabe', label: 'Árabe' },
];

export function Step1BasicInfo({ data, onChange }: Props) {
  const update = (field: keyof BasicInfo, value: string | number | string[]) => {
    onChange({ basicInfo: { ...data, [field]: value } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-cinema-text mb-1">Información básica de la película</h2>
        <p className="text-cinema-text-dim text-sm">Datos fundamentales que definirán tu estrategia de distribución.</p>
      </div>

      <SectionCard title="Identificación de la obra">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Título de la película"
            placeholder="El título como aparecerá en festivales"
            value={data.title ?? ''}
            onChange={e => update('title', e.target.value)}
            required
          />
          <Input
            label="Título original (si difiere)"
            placeholder="Título en idioma original"
            value={data.originalTitle ?? ''}
            onChange={e => update('originalTitle', e.target.value)}
          />
          <Select
            label="Tipo de obra"
            options={FILM_TYPES}
            value={data.filmType ?? ''}
            onChange={e => update('filmType', e.target.value)}
            placeholder="Selecciona el tipo"
            required
          />
          <Select
            label="Género principal"
            options={GENRES}
            value={data.genre ?? ''}
            onChange={e => update('genre', e.target.value)}
            placeholder="Selecciona el género"
            required
          />
          <Input
            label="Subgénero o estilo"
            placeholder="Ej: Noir contemporáneo, Drama rural..."
            value={data.subgenre ?? ''}
            onChange={e => update('subgenre', e.target.value)}
          />
          <Input
            label="Duración (minutos)"
            type="number"
            min={1}
            max={300}
            placeholder="Duración exacta en minutos"
            value={data.duration ?? ''}
            onChange={e => update('duration', parseInt(e.target.value) || 0)}
            required
          />
          <Input
            label="Año de producción"
            type="number"
            min={2000}
            max={2030}
            placeholder="2024"
            value={data.productionYear ?? ''}
            onChange={e => update('productionYear', parseInt(e.target.value) || 0)}
            required
          />
          <Input
            label="País de producción"
            placeholder="España"
            value={data.country ?? ''}
            onChange={e => update('country', e.target.value)}
            required
          />
          <Input
            label="Países de coproducción"
            placeholder="Francia, Alemania (si aplica)"
            value={data.coProducingCountries ?? ''}
            onChange={e => update('coProducingCountries', e.target.value)}
            className="sm:col-span-2"
          />
        </div>
      </SectionCard>

      <SectionCard title="Idioma y versiones">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Idioma original"
            options={LANGUAGES}
            value={data.originalLanguage ?? ''}
            onChange={e => update('originalLanguage', e.target.value)}
            placeholder="Selecciona el idioma"
            required
          />
        </div>
        <div className="mt-4">
          <CheckboxGroup
            label="Subtítulos disponibles"
            hint="Selecciona todos los idiomas de subtítulos que tienes listos o en proceso"
            options={SUBTITLE_OPTIONS}
            selected={data.availableSubtitles ?? []}
            onChange={values => update('availableSubtitles', values)}
            columns={3}
          />
        </div>
      </SectionCard>

      <SectionCard title="Equipo de producción">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Empresa productora"
            placeholder="Nombre de la productora"
            value={data.productionCompany ?? ''}
            onChange={e => update('productionCompany', e.target.value)}
          />
          <Input
            label="Director/a"
            placeholder="Nombre completo del director/a"
            value={data.directorName ?? ''}
            onChange={e => update('directorName', e.target.value)}
            required
          />
          <Input
            label="Productor/a"
            placeholder="Nombre completo del productor/a"
            value={data.producerName ?? ''}
            onChange={e => update('producerName', e.target.value)}
          />
          <Input
            label="Página web del proyecto"
            placeholder="https://www.mipelicula.com"
            value={data.website ?? ''}
            onChange={e => update('website', e.target.value)}
            type="url"
          />
        </div>
      </SectionCard>
    </div>
  );
}
