"use client"
import { useCallback, useEffect, useMemo, useState } from 'react'

type Tally = {
  openai: number
  anthropic: number
  total: number
}

export function PollClient({ pollId, question, expiresAt }: { pollId: string; question: string; expiresAt: string }) {
  const [fid, setFid] = useState<number | ''>('')
  const [tally, setTally] = useState<Tally>({ openai: 0, anthropic: 0, total: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const expired = useMemo(() => {
    const t = new Date(expiresAt).getTime()
    return Number.isFinite(t) && now >= t
  }, [expiresAt, now])

  const openaiPct = useMemo(() => (tally.total ? Math.round((tally.openai / tally.total) * 100) : 0), [tally])
  const anthropicPct = 100 - openaiPct

  const fetchTally = useCallback(async () => {
    try {
      const fidQuery = fid && !Number.isNaN(Number(fid)) ? `&fid=${fid}` : ''
      const res = await fetch(`/api/vote?poll_id=${encodeURIComponent(pollId)}${fidQuery}`, { cache: 'no-store' })
      const data = (await res.json()) as (Tally & { hasVoted?: boolean }) | { error: string }
      if ('error' in data) return
      setTally({ openai: data.openai, anthropic: data.anthropic, total: data.total })
      if (typeof data.hasVoted === 'boolean') setHasVoted(data.hasVoted)
    } catch {}
  }, [pollId, fid])

  useEffect(() => {
    fetchTally()
    const id = setInterval(fetchTally, 2000)
    return () => clearInterval(id)
  }, [fetchTally])

  // Tick the clock every 10s to update expiration UI
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10000)
    return () => clearInterval(id)
  }, [])

  const vote = async (choice: 'openai' | 'anthropic') => {
    setError(null)
    if (!fid || Number.isNaN(Number(fid))) {
      setError('Please enter a valid fid (number).')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid: Number(fid), poll_id: pollId, choice }),
      })
      if (res.ok) {
        const data = (await res.json()) as Tally
        setTally(data)
        setHasVoted(true)
      } else if (res.status === 409) {
        setHasVoted(true)
        await fetchTally()
        setError('You have already voted on this poll.')
      } else {
        const j = await res.json().catch(() => ({}))
        setError((j as any)?.error || 'Failed to submit vote')
      }
    } catch (e: any) {
      setError(e?.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-5">
      <h2 className="mb-2 text-xl font-medium">{question}</h2>
      <div className="mb-4 text-sm text-neutral-400">Poll ID: {pollId}</div>

      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="fid" className="text-sm text-neutral-400">
          Your fid
        </label>
        <input
          id="fid"
          inputMode="numeric"
          placeholder="e.g. 1234"
          className="w-32 rounded-md border border-neutral-800 bg-neutral-900 p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
          value={fid}
          onChange={(e) => setFid(e.target.value === '' ? '' : Number(e.target.value))}
        />
      </div>

      <div className="mb-5 flex gap-3">
        <button
          disabled={loading || hasVoted || expired}
          onClick={() => vote('openai')}
          className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          OpenAI
        </button>
        <button
          disabled={loading || hasVoted || expired}
          onClick={() => vote('anthropic')}
          className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anthropic
        </button>
      </div>

      {error && <div className="mb-3 text-sm text-red-400">{error}</div>}

      {!expired && !hasVoted && (
        <div className="text-sm text-neutral-400">Vote to see live results. Poll closes at {new Date(expiresAt).toLocaleString()}.</div>
      )}

      {(expired || hasVoted) && (
      <div className="space-y-3">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>OpenAI</span>
              <span>{openaiPct}% ({tally.openai})</span>
            </div>
            <div className="h-3 w-full rounded bg-neutral-800">
              <div className="h-3 rounded bg-indigo-600" style={{ width: `${openaiPct}%` }} />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>Anthropic</span>
              <span>{anthropicPct}% ({tally.anthropic})</span>
            </div>
            <div className="h-3 w-full rounded bg-neutral-800">
              <div className="h-3 rounded bg-emerald-600" style={{ width: `${anthropicPct}%` }} />
            </div>
          </div>
          <div className="text-right text-xs text-neutral-400">Total votes: {tally.total}</div>
        </div>
      )}
    </section>
  )
}
