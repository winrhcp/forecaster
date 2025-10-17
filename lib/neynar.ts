export type FrameVerifyResult = {
  valid: boolean
  fid?: number
  error?: string
}

export async function verifyWithNeynar(messageBytes: string): Promise<FrameVerifyResult> {
  const apiKey = process.env.NEYNAR_API_KEY
  if (!apiKey) return { valid: false, error: 'missing_api_key' }

  const url = 'https://api.neynar.com/v2/farcaster/frame/validate'

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'api_key': apiKey,
      },
      body: JSON.stringify({ message_bytes: messageBytes }),
      // Do not cache verification
      cache: 'no-store',
    })
  } catch (e: any) {
    return { valid: false, error: e?.message || 'verify_network_error' }
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    return { valid: false, error: `verify_http_${res.status}:${txt}` }
  }

  const data = await res.json().catch(() => ({}))
  const valid: boolean = !!data?.valid
  const fid: number | undefined = data?.action?.interactor?.fid
  return { valid, fid }
}

