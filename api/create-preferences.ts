// api/create-preferences.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import mercadopago from 'mercadopago'
import fetch from 'node-fetch'

// keep your v1 setup
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN!
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { title, quantity, unit_price, metadata } = req.body
  const { formularioPrincipal, entradas } = metadata

  // 1️⃣ Create the preference *first* so we get back the ID
  const { body: pref } = await mercadopago.preferences.create({
    items: [{ title, quantity, currency_id: 'CLP', unit_price }],
    back_urls: {
      success: `${process.env.SITE_URL}/api/mp-success`,
      failure: `${process.env.SITE_URL}/api/mp-success`
    },
    auto_return: 'approved'
  })
  const preferenceId = pref.id!

  // 2️⃣ Write all your rows *with* that preferenceId
  await fetch(process.env.GAS_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action:       'insert',
      preferenceId,           // ≤ you’ll use this later
      ...formularioPrincipal, // rut, email, telefono
      entradas                // array of persona objects
    })
  })

  // 3️⃣ Zero-price shortcut?
  if (unit_price <= 0) {
    return res.status(200).json({ redirectTo: '/gracias' })
  }

  // 4️⃣ Otherwise send them to MP
  return res.status(200).json({ init_point: pref.init_point })
}