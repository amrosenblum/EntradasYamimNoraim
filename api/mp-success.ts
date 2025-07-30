// api/mp-success.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import mercadopago from 'mercadopago'        // ➊
import fetch from 'node-fetch'

// ➊ Configure the SDK so we can fetch the preference
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN!
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // MercadoPago calls this as a GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end('Method Not Allowed')
  }

  const {
    collection_status,    // “approved” or “rejected”
    payment_id,
    preference_id
  } = req.query

  // Only record approved payments
  if (collection_status === 'approved') {
    try {
      // ➋ Fetch the full preference, which contains your metadata
      const { body: pref } = await mercadopago.preferences.get(
        String(preference_id)
      )

      // ➌ Pull out exactly what you sent in create-preferences.ts
      const {
        formularioPrincipal,
        entradas
      } = pref.metadata as {
        formularioPrincipal: { rut: string; email: string; telefono: string }
        entradas: Array<{ tipo: string; nombre: string; apellido: string; genero: string; nusaj: string }>
      }

      // ➍ Build the payload your Apps Script expects:
      const payload = {
        ...formularioPrincipal,   // rut, email, telefono
        entradas,                 // array of persona objects
        payment_id,
        preference_id,
        collection_status
      }

      // ➎ Send it to your Google Script
      await fetch(process.env.GAS_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (err: any) {
      console.error('MP→Sheets error', err)
      // optionally redirect to error page here
    }
  }

  // Finally, redirect the browser into your SPA thank-you page
  res.writeHead(302, { Location: '/gracias' })
  res.end()
}