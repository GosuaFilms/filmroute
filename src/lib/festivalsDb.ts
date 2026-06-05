import { supabase } from './supabase';
import type { RecommendedFestival } from '../types/film';

export interface FestivalRow {
  id: string;
  name: string;
  country: string;
  city: string;
  tier: string;
  month: string;
  deadline: string;
  submission_fee: string;
  platform: string;
  url: string;
  genres: string[];
  accepts_types: string[];
  prestige: number;
  reason: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type FestivalInput = Omit<FestivalRow, 'id' | 'created_at' | 'updated_at'>;

export function rowToFestival(row: FestivalRow): RecommendedFestival {
  return {
    name: row.name,
    country: row.country,
    city: row.city,
    tier: row.tier as RecommendedFestival['tier'],
    month: row.month,
    deadline: row.deadline,
    submissionFee: row.submission_fee,
    platform: row.platform,
    url: row.url,
    genres: row.genres as RecommendedFestival['genres'],
    acceptsTypes: row.accepts_types as RecommendedFestival['acceptsTypes'],
    prestige: row.prestige,
    reason: row.reason,
  };
}

export async function listFestivalsFromDb(): Promise<FestivalRow[]> {
  const { data, error } = await supabase
    .from('festivals')
    .select('*')
    .eq('active', true)
    .order('prestige', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FestivalRow[];
}

export async function listAllFestivalsAdmin(): Promise<FestivalRow[]> {
  const { data, error } = await supabase
    .from('festivals')
    .select('*')
    .order('prestige', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FestivalRow[];
}

export async function createFestival(input: FestivalInput): Promise<FestivalRow> {
  const { data, error } = await supabase
    .from('festivals')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as FestivalRow;
}

export async function updateFestival(id: string, input: Partial<FestivalInput>): Promise<FestivalRow> {
  const { data, error } = await supabase
    .from('festivals')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as FestivalRow;
}

export async function deleteFestival(id: string): Promise<void> {
  const { error } = await supabase.from('festivals').delete().eq('id', id);
  if (error) throw error;
}

export async function getIsAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();
  return data?.is_admin === true;
}
