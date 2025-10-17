import Link from 'next/link'
import { getPolls } from '@/lib/polls'

export default async function Page() {
  const polls = await getPolls()

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-6 p-6 text-white">
      <h1 className="text-3xl font-semibold">Forecaster</h1>
      <p className="text-neutral-300">Predict the future, one cast at a time.</p>

      <section className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-5">
        <h2 className="mb-4 text-xl font-medium">Available Polls</h2>
        <ul className="space-y-3">
          {polls.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded-md border border-neutral-800 bg-neutral-900 p-4">
              <div>
                <div className="text-sm text-neutral-400">{p.id}</div>
                <div className="text-base font-medium">{p.question}</div>
              </div>
              <Link
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium hover:bg-indigo-500"
                href={`/p/${encodeURIComponent(p.id)}`}
              >
                Vote
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="text-xs text-neutral-500">Farcaster fid is derived from FIP-11 in production.</div>
    </main>
  )
}
