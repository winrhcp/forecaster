import { NextRequest } from 'next/server'
import { verifyWithNeynar } from '@/lib/neynar'
import { getServiceSupabase, getTally } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

type FrameBody = {
  untrustedData?: {
    fid?: number
    buttonIndex?: number
    inputText?: string
    url?: string
  }
  trustedData?: {
    messageBytes?: string
  }
}

function choiceFromButtonIndex(idx?: number): 'openai' | 'anthropic' | null {
  if (idx === 1) return 'openai'
  if (idx === 2) return 'anthropic'
  return null
}

export async function POST(req: NextRequest) {
  const supabase = getServiceSupabase()
  const { searchParams } = new URL(req.url)
  const pollId = searchParams.get('poll_id')
  if (!pollId) {
    return Response.json({ error: 'missing_poll_id' }, { status: 400 })
  }

  let body: FrameBody
  try {
    body = (await req.json()) as FrameBody
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  const messageBytes = body?.trustedData?.messageBytes
  const buttonIndex = body?.untrustedData?.buttonIndex
  const choice = choiceFromButtonIndex(buttonIndex)
  if (!messageBytes) {
    return Response.json({ error: 'missing_message_bytes' }, { status: 400 })
  }
  if (!choice) {
    return Response.json({ error: 'invalid_button_index' }, { status: 400 })
  }

  const verify = await verifyWithNeynar(messageBytes)
  if (!verify.valid || !verify.fid) {
    return Response.json({ error: 'verification_failed' }, { status: 401 })
  }

  const fid = verify.fid

  const { error } = await supabase.from('votes').insert({ poll_id: pollId, fid, choice })
  if (error) {
    if ((error as any).code === '23505') {
      // already voted
    } else {
      return Response.json({ error: 'insert_failed', details: error.message }, { status: 500 })
    }
  }

  try {
    const tally = await getTally(pollId)
    return Response.json({ ok: true, fid, poll_id: pollId, choice, tally })
  } catch (e: any) {
    return Response.json({ error: 'tally_failed', details: e?.message }, { status: 500 })
  }
}

