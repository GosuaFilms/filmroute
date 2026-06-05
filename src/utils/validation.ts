import type { FilmData } from '../types/film';

export type StepErrors = Record<string, string>;

function required(value: unknown, msg: string): string | null {
  if (value === undefined || value === null) return msg;
  if (typeof value === 'string' && !value.trim()) return msg;
  if (typeof value === 'number' && value <= 0) return msg;
  if (Array.isArray(value) && value.length === 0) return msg;
  return null;
}

export function validateStep(step: number, data: FilmData): StepErrors {
  const errors: StepErrors = {};

  const add = (key: string, msg: string | null) => {
    if (msg) errors[key] = msg;
  };

  if (step === 1) {
    const b = data.basicInfo;
    add('title', required(b.title, 'El título es obligatorio'));
    add('filmType', required(b.filmType, 'Selecciona el tipo de obra'));
    add('genre', required(b.genre, 'Selecciona el género principal'));
    add('duration', required(b.duration, 'Indica la duración en minutos'));
    add('productionYear', required(b.productionYear, 'Indica el año de producción'));
    add('country', required(b.country, 'Indica el país de producción'));
    add('originalLanguage', required(b.originalLanguage, 'Selecciona el idioma original'));
    add('directorName', required(b.directorName, 'El nombre del director/a es obligatorio'));
  }

  if (step === 2) {
    const c = data.creativeDetails;
    add('shortSynopsis', required(c.shortSynopsis, 'La sinopsis breve es obligatoria'));
    add('targetAudience', required(c.targetAudience, 'Define el público objetivo'));
  }

  if (step === 4) {
    const d = data.distributionGoals;
    add('primaryTargets', required(d.primaryTargets, 'Selecciona al menos un objetivo de distribución'));
  }

  if (step === 5) {
    const f = data.festivalStrategy;
    add('targetTiers', required(f.targetTiers, 'Selecciona al menos un nivel de festival'));
    add('startDate', required(f.startDate, 'Indica la fecha prevista de inicio'));
  }

  if (step === 6) {
    const b = data.budgetResources;
    add('totalDistributionBudget', required(b.totalDistributionBudget, 'Indica el presupuesto total de distribución'));
  }

  return errors;
}

export function hasErrors(errors: StepErrors): boolean {
  return Object.keys(errors).length > 0;
}
