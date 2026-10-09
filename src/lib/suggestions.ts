import { supabase } from './supabase';

export type SuggestionStatus = 'pendiente' | 'añadida' | 'descartada';

export interface SuggestionRow {
  id: string;
  kind: 'festival' | 'platform';
  name: string;
  country: string;
  city: string;
  dates: string;
  deadline: string;
  submission_fee: string;
  platform_type: string;
  territory: string;
  notes: string;
  url: string;
  film_types: string[];
  film_genres: string[];
  times_suggested: number;
  status: SuggestionStatus;
  first_suggested_at: string;
  last_suggested_at: string;
}

export async function listSuggestions(): Promise<SuggestionRow[]> {
  const { data, error } = await supabase
    .from('external_suggestions')
    .select('*')
    .order('last_suggested_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SuggestionRow[];
}

export async function setSuggestionStatus(id: string, status: SuggestionStatus): Promise<void> {
  const { error } = await supabase.from('external_suggestions').update({ status }).eq('id', id);
  if (error) throw error;
}
