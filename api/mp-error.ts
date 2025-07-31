// api/mp-error.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import fetch from 'node-fetch'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // MercadoPago will redirect here on failure, e.g.
  // GET /api/mp-error?preference_id=YOUR_PREF_ID&collection_status=…
  const pref = String(req.query.preference_id || '')

  // 1) Tell your Apps Script to delete any rows with that pref ID
  await fetch(process.env.GAS_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action:       'delete',
      preferenceId: pref
    })
  })

  // 2) Now redirect into your SPA’s /error page
  res.writeHead(302, { Location: '/error' })
  res.end()
}
