// api/mp-error.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import fetch from 'node-fetch'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pref = Array.isArray(req.query.preference_id)
    ? req.query.preference_id[0]
    : req.query.preference_id || ''

  console.log('🔴 mp-error, preference_id=', pref)

  if (pref) {
    await fetch(process.env.GAS_URL!, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ action: 'delete', preferenceId: pref })
    })
  }

  return res.redirect('/error')
}
