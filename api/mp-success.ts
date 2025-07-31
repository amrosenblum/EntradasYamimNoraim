import type { VercelRequest, VercelResponse } from '@vercel/node'
import fetch from 'node-fetch'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end('Method Not Allowed')
  }
  const { collection_status, payment_id, preference_id } = req.query
  const action = collection_status === 'approved' ? 'confirm' : 'delete'

  // Tell the Apps Script what to do
  await fetch(process.env.GAS_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,             // 'confirm' or 'delete'
      preferenceId: preference_id,
      payment_id,
      status: collection_status
    })
  })

  // Always send user on to /gracias
  res.writeHead(302, { Location: '/gracias' })
  res.end()
}