import { NextRequest } from 'next/server'
import { getServiceSupabase, getTally } from '@/lib/supabaseServer'
import { getPollById, isPollExpired } from '@/lib/polls'

export const runtime = 'nodejs'

type VoteBody = {
  fid: number
  poll_id: string
  choice: 'openai' | 'anthropic'
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pollId = searchParams.get('poll_id')
  const fidParam = searchParams.get('fid')
  if (!pollId) {
    return Response.json({ error: 'missing_poll_id' }, { status: 400 })
  }

  try {
    const tally = await getTally(pollId)
    let hasVoted = false
    if (fidParam) {
      const supabase = getServiceSupabase()
      const fid = Number(fidParam)
      if (!Number.isNaN(fid)) {
        const { count, error } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('poll_id', pollId)
          .eq('fid', fid)
        if (!error) hasVoted = (count ?? 0) > 0
      }
    }
    return Response.json({ ...tally, hasVoted })
  } catch (e: any) {
    return Response.json({ error: 'tally_failed', details: e?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = getServiceSupabase()
  let body: VoteBody
  try {
    body = (await req.json()) as VoteBody
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { fid, poll_id, choice } = body || {}

  if (!fid || !poll_id || !choice || !['openai', 'anthropic'].includes(choice)) {
    return Response.json({ error: 'invalid_payload' }, { status: 400 })
  }

  // Check poll expiry
  const poll = await getPollById(poll_id)
  if (!poll) return Response.json({ error: 'poll_not_found' }, { status: 404 })
  if (isPollExpired(poll)) return Response.json({ error: 'poll_expired' }, { status: 403 })

  // Attempt insert; rely on unique (poll_id, fid) to reject duplicates
  const { error } = await supabase.from('votes').insert({ poll_id, fid, choice })

  if (error) {
    // Postgres unique_violation
    if ((error as any).code === '23505') {
      return Response.json({ error: 'duplicate_vote' }, { status: 409 })
    }
    return Response.json({ error: 'insert_failed', details: error.message }, { status: 500 })
  }

  try {
    const tally = await getTally(poll_id)
    return Response.json(tally)
  } catch (e: any) {
    return Response.json({ error: 'tally_failed', details: e?.message }, { status: 500 })
  }
}
