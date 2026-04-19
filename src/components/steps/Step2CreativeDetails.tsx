import type { CreativeDetails, FilmData } from '../../types/film';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { SectionCard } from '../ui/SectionCard';
import { CheckboxGroup } from '../ui/CheckboxGroup';

interface Props {
  data: Partial<CreativeDetails>;
  onChange: (data: Partial<FilmData>) => void;
}

const THEMES = [
  { value: 'identidad', label: 'Identidad y pertenencia' },
  { value: 'migracion', label: 'Migración y refugio' },
  { value: 'genero', label: 'Género y feminismo' },
  { value: 'lgbtiq', label: 'LGBTIQ+' },
  { value: 'familia', label: 'Familia y relaciones' },
  { value: 'memoria', label: 'Memoria histórica' },
  { value: 'guerra', label: 'Guerra y conflicto' },
  { value: 'medioambiente', label: 'Medioambiente y clima' },
  { value: 'juventud', label: 'Juventud y adolescencia' },
  { value: 'vejez', label: 'Vejez y muerte' },
  { value: 'poder', label: 'Poder y política' },
  { value: 'religion', label: 'Religión y espiritualidad' },
  { value: 'tecnologia', label: 'Tecnología y futuro' },
  { value: 'clase_social', label: 'Clase social y desigualdad' },
  { value: 'arte', label: 'Arte y creatividad' },
  { value: 'infancia', label: 'Infancia' },
  { value: 'discapacidad', label: 'Discapacidad' },
  { value: 'salud_mental', label: 'Salud mental' },
];

const AUDIENCES = [
  { value: 'familiar', label: 'Familiar (todas las edades)' },
  { value: 'infantil', label: 'Infantil (+3)' },
  { value: 'juvenil', label: 'Juvenil (+12)' },
  { value: 'adulto', label: 'Adulto (+18)' },
  { value: 'adulto_mayor', label: 'Adulto mayor (+55)' },
  { value: 'cinefilo', label: 'Cinéfilo / cine de autor' },
  { value: 'academico', label: 'Académico / educativo' },
  { value: 'general', label: 'Público general' },
];

const AGE_RATINGS = [
  { value: 'TP', label: 'TP - Todos los públicos' },
  { value: '+7', label: '+7 años' },
  { value: '+12', label: '+12 años' },
  { value: '+16', label: '+16 años' },
  { value: '+18', label: '+18 años / Adultos' },
  { value: 'NR', label: 'Sin calificar (NR)' },
];

export function Step2CreativeDetails({ data, onChange }: Props) {
  const update = (field: keyof CreativeDetails, value: string | string[]) => {
    onChange({ creativeDetails: { ...data, [field]: value } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-cinema-text mb-1">Detalles creativos y artísticos</h2>
        <p className="text-cinema-text-dim text-sm">Esta información permite identificar los festivales y plataformas más afines a tu obra.</p>
      </div>

      <SectionCard title="Sinopsis">
        <div className="space-y-4">
          <Textarea
            label="Sinopsis corta (máx. 100 palabras)"
            hint="La que aparece en catálogos de festivales y plataformas"
            placeholder="Una frase poderosa que capture la esencia de tu película..."
            value={data.shortSynopsis ?? ''}
            onChange={e => update('shortSynopsis', e.target.value)}
            rows={3}
            required
          />
          <Textarea
            label="Sinopsis larga (máx. 400 palabras)"
            hint="Para el press kit y materiales de prensa"
            placeholder="Descripción completa de la historia, personajes y conflicto principal..."
            value={data.longSynopsis ?? ''}
            onChange={e => update('longSynopsis', e.target.value)}
            rows={6}
          />
        </div>
      </SectionCard>

      <SectionCard title="Temáticas y público">
        <div className="space-y-5">
          <CheckboxGroup
            label="Temáticas principales de la película"
            hint="Selecciona las temáticas que aborda tu obra (ayuda a identificar festivales especializados)"
            options={THEMES}
            selected={data.themes ?? []}
            onChange={values => update('themes', values)}
            columns={2}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Público objetivo principal"
              options={AUDIENCES}
              value={data.targetAudience ?? ''}
              onChange={e => update('targetAudience', e.target.value)}
              placeholder="Selecciona el público"
              required
            />
            <Select
              label="Clasificación por edades"
              options={AGE_RATINGS}
              value={data.ageRating ?? ''}
              onChange={e => update('ageRating', e.target.value)}
              placeholder="Selecciona la clasificación"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Atractivos comerciales y artísticos">
        <div className="space-y-4">
          <Textarea
            label="Reparto y equipo técnico notable"
            hint="Actores, directores de fotografía, compositores con trayectoria reconocida"
            placeholder="Protagonizada por [nombre], con fotografía de [nombre]..."
            value={data.notableCast ?? ''}
            onChange={e => update('notableCast', e.target.value)}
            rows={3}
          />
          <Textarea
            label="Premios y selecciones previas"
            hint="Si la película ya ha participado en festivales, indica los logros"
            placeholder="Selección oficial en [festival], Premio [nombre] en [festival]..."
            value={data.awards ?? ''}
            onChange={e => update('awards', e.target.value)}
            rows={3}
          />
          <Textarea
            label="Proyecciones anteriores"
            hint="Proyecciones ya realizadas (importantes para saber el estado del estreno mundial)"
            placeholder="Preestreno en [lugar], proyección especial en [evento]..."
            value={data.previousScreenings ?? ''}
            onChange={e => update('previousScreenings', e.target.value)}
            rows={2}
          />
        </div>
      </SectionCard>

      <SectionCard title="Propuesta artística">
        <div className="space-y-4">
          <Textarea
            label="Punto de diferenciación único (USP)"
            hint="¿Qué hace única a esta película? ¿Por qué merece ser vista?"
            placeholder="Esta película es la primera que... / Aborda de forma inédita..."
            value={data.uniqueSellingPoint ?? ''}
            onChange={e => update('uniqueSellingPoint', e.target.value)}
            rows={3}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Estilo visual / referentes estéticos"
              placeholder="Ej: Realismo poético, estética Dardenne, cine nórdico..."
              value={data.visualStyle ?? ''}
              onChange={e => update('visualStyle', e.target.value)}
            />
            <Input
              label="Películas de referencia / inspiraciones"
              placeholder="Ej: Nomadland, Roma, El apartamento..."
              value={data.inspirations ?? ''}
              onChange={e => update('inspirations', e.target.value)}
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
