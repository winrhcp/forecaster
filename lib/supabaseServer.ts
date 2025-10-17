import { createClient } from '@supabase/supabase-js'

export function getServiceSupabase() {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export type Tally = {
  openai: number
  anthropic: number
  total: number
}

export async function getTally(pollId: string): Promise<Tally> {
  const supabase = getServiceSupabase()

  const [{ count: openaiCount, error: e1 }, { count: anthropicCount, error: e2 }] = await Promise.all([
    supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('poll_id', pollId)
      .eq('choice', 'openai'),
    supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('poll_id', pollId)
      .eq('choice', 'anthropic'),
  ])

  if (e1) throw e1
  if (e2) throw e2

  const openai = openaiCount ?? 0
  const anthropic = anthropicCount ?? 0
  return { openai, anthropic, total: openai + anthropic }
}

