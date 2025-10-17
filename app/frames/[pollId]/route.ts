import { getPollById, isPollExpired } from '@/lib/polls'

export const runtime = 'nodejs'

export async function GET(req: Request, { params }: { params: { pollId: string } }) {
  const pollId = params.pollId
  const poll = await getPollById(pollId)
  if (!poll) {
    return new Response('Poll not found', { status: 404 })
  }

  const url = new URL(req.url)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${url.protocol}//${url.host}`
  const postUrl = `${baseUrl}/api/frame/vote?poll_id=${encodeURIComponent(pollId)}`

  // Use a placeholder OG image service; replace with your own if desired
  const title = poll.question
  const expired = isPollExpired(poll)
  const label1 = 'OpenAI'
  const label2 = 'Anthropic'
  const banner = expired ? `${title} — Poll Closed` : title
  const imageUrl = `https://placehold.co/1200x630/111/fff?text=${encodeURIComponent(banner)}`

  const html = `<!doctype html>
<html>
  <head>
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta name="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${imageUrl}" />
    <meta property="fc:frame:post_url" content="${postUrl}" />
    <meta property="fc:frame:button:1" content="${label1}" />
    <meta property="fc:frame:button:1:action" content="post" />
    <meta property="fc:frame:button:2" content="${label2}" />
    <meta property="fc:frame:button:2:action" content="post" />
  </head>
  <body />
  </html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  })
}

function escapeHtml(str: string) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

