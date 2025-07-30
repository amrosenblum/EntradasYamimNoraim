import type { VercelRequest, VercelResponse } from '@vercel/node'
import mercadopago from 'mercadopago'
import fetch from 'node-fetch'

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN!
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end('Method Not Allowed')
  }

  const { collection_status, payment_id, preference_id } = req.query

  if (collection_status === 'approved') {
    // 1) get the preference
    const { body: pref } = await mercadopago.preferences.get(
      String(preference_id)
    )

    // 2) parse your JSON payload out of external_reference
    const external = pref.external_reference as string
    const { formularioPrincipal, entradas } = JSON.parse(external)

    // 3) build exactly what your Apps Script expects:
    const payload = {
      ...formularioPrincipal,  // brings rut/email/telefono
      entradas,                // array of persona objects
      payment_id,
      collection_status,
      preference_id
    }

    // 4) write to Google Sheets
    await fetch(process.env.GAS_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  // 5) redirect user to your SPA thank-you route
  res.writeHead(302, { Location: '/gracias' })
  res.end()
}
