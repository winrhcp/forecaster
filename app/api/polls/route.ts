import { getPolls } from '@/lib/polls'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const polls = await getPolls()
    return Response.json({ polls })
  } catch (e: any) {
    return Response.json({ error: 'polls_fetch_failed', details: e?.message }, { status: 500 })
  }
}

