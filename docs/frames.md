Frames integration (Neynar)

- Endpoint: `POST /api/frame/vote?poll_id=...`
  - Request body (Warpcast style):
    - `trustedData.messageBytes` (hex string)
    - `untrustedData.buttonIndex` (1 or 2)
  - Server verification: Calls Neynar `v2/farcaster/frame/validate` with `message_bytes`.
  - Choice mapping: buttonIndex 1 → `openai`, 2 → `anthropic`.
  - Response: `{ ok, fid, poll_id, choice, tally }`.

Environment variables
- `NEYNAR_API_KEY` must be set in `.env.local`.

Notes
- The web UI still includes a `fid` input for local testing. The Frames route ignores client-provided fids and derives `fid` from the verified payload.

