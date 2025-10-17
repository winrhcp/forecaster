import { notFound } from 'next/navigation'
import { getPollById } from '@/lib/polls'
import { PollClient } from '@/components/PollClient'

export default async function PollPage({ params }: { params: { pollId: string } }) {
  const poll = await getPollById(params.pollId)
  if (!poll) return notFound()

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center gap-6 p-6 text-white">
      <h1 className="text-3xl font-semibold">Forecaster</h1>
      <PollClient pollId={poll.id} question={poll.question} />
      <div className="text-xs text-neutral-500">Farcaster fid is derived from FIP-11 in production.</div>
    </main>
  )
}

