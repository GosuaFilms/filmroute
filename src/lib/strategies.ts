import { supabase } from './supabase';
import type { FilmData, StrategyReport } from '../types/film';

export interface SavedStrategy {
  id: string;
  user_id: string;
  film_title: string;
  film_data: FilmData;
  report: StrategyReport | null;
  created_at: string;
  updated_at: string;
}

export async function saveStrategy(
  filmData: FilmData,
  report: StrategyReport
): Promise<SavedStrategy> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const title = filmData.basicInfo?.title?.trim() || 'Sin título';

  const { data, error } = await supabase
    .from('strategies')
    .insert({
      user_id: user.id,
      film_title: title,
      film_data: filmData,
      report,
    })
    .select()
    .single();

  if (error) throw error;
  return data as SavedStrategy;
}

export async function updateStrategy(
  id: string,
  filmData: FilmData,
  report: StrategyReport
): Promise<SavedStrategy> {
  const title = filmData.basicInfo?.title?.trim() || 'Sin título';

  const { data, error } = await supabase
    .from('strategies')
    .update({
      film_title: title,
      film_data: filmData,
      report,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as SavedStrategy;
}

export async function listStrategies(): Promise<SavedStrategy[]> {
  const { data, error } = await supabase
    .from('strategies')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as SavedStrategy[];
}

export async function deleteStrategy(id: string): Promise<void> {
  const { error } = await supabase
    .from('strategies')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
