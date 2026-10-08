import { supabase } from './supabase';

export type SubmissionStatus = 'pendiente' | 'enviado' | 'seleccionado' | 'rechazado' | 'retirado';

export interface Submission {
  id: string;
  user_id: string;
  strategy_id: string;
  festival_name: string;
  festival_country: string;
  festival_tier: string;
  status: SubmissionStatus;
  submission_date: string | null;
  deadline: string | null;
  response_date: string | null;
  fee_paid: number | null;
  platform: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type SubmissionInput = Omit<Submission, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export async function listSubmissions(strategyId: string): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('strategy_id', strategyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Submission[];
}

export async function createSubmission(input: SubmissionInput): Promise<Submission> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('submissions')
    .insert({ ...input, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as Submission;
}

export async function updateSubmission(id: string, patch: Partial<SubmissionInput>): Promise<Submission> {
  const { data, error } = await supabase
    .from('submissions')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Submission;
}

export async function deleteSubmission(id: string): Promise<void> {
  const { error } = await supabase.from('submissions').delete().eq('id', id);
  if (error) throw error;
}

export interface SubmissionStats {
  total: number;
  selected: number;
}

export async function getSubmissionStatsByStrategy(): Promise<Record<string, SubmissionStats>> {
  const { data, error } = await supabase.from('submissions').select('strategy_id, status');
  if (error) throw error;
  const stats: Record<string, SubmissionStats> = {};
  for (const row of (data ?? []) as { strategy_id: string; status: SubmissionStatus }[]) {
    const s = stats[row.strategy_id] ??= { total: 0, selected: 0 };
    s.total += 1;
    if (row.status === 'seleccionado') s.selected += 1;
  }
  return stats;
}

export async function listAllSubmissionsForUser(): Promise<(Submission & { film_title: string })[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*, strategies(film_title)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...(row as unknown as Submission),
    film_title: (row.strategies as { film_title: string } | null)?.film_title ?? '',
  }));
}
