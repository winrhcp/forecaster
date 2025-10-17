import { promises as fs } from 'fs'
import path from 'path'
import { getServiceSupabase } from '@/lib/supabaseServer'

export type Poll = {
  id: string
  question: string
}

async function readLocalPolls(): Promise<Poll[]> {
  const file = path.join(process.cwd(), 'config', 'polls.json')
  const raw = await fs.readFile(file, 'utf8')
  const data = JSON.parse(raw) as Poll[]
  return data
}

export async function getPolls(): Promise<Poll[]> {
  // Try Supabase first if env is configured
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (url && key) {
    try {
      const supabase = getServiceSupabase()
      const { data, error } = await supabase
        .from('polls')
        .select('id, question')
        .order('created_at', { ascending: true })

      if (!error && data && data.length) return data as Poll[]
    } catch (e: any) {
      // table might not exist or other server errors; fall back to local
    }
  }

  // Fallback to local JSON config
  return readLocalPolls()
}

export async function getPollById(pollId: string): Promise<Poll | null> {
  const polls = await getPolls()
  return polls.find((p) => p.id === pollId) ?? null
}

