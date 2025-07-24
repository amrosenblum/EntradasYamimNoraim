// api/mp-success.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import fetch from 'node-fetch'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // MercadoPago will hit this as a GET on success
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end('Method Not Allowed')
  }

  // Extract the params MercadoPago appended to your success URL
  const {
    collection_status,
    payment_id,
    preference_id,
    external_reference,  // if you passed this in create-preferences
    ...others
  } = req.query

  // Only log to your sheet if the payment was approved
  if (collection_status === 'approved') {
    const payload = {
      collection_status,
      payment_id,
      preference_id,
      external_reference,
      ...others
    }
    await fetch(process.env.GAS_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  // Finally, send the user on to your thank‑you page
  res.writeHead(302, { Location: '/gracias' })
  res.end()
}
