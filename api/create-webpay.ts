import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  WebpayPlus,
  Options,
  IntegrationApiKeys,
  Environment,
  IntegrationCommerceCodes
} from 'transbank-sdk'

// 1️⃣ Instantiate a WebpayPlus client for integration (sandbox)
const webpayClient = new WebpayPlus.Transaction(
  new Options(
    IntegrationCommerceCodes.WEBPAY_PLUS,    // sandbox commerce code
    IntegrationApiKeys.WEBPAY,               // sandbox API key
    Environment.Integration                  // environment enum
  )
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const { title, quantity, unit_price, metadata } = req.body
  const { formularioPrincipal, entradas } = metadata

  // — Zero‑price shortcut (“pagaré después”) —
  if (unit_price <= 0) {
    const payload = { ...formularioPrincipal, entradas }
    await fetch(process.env.GAS_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return res.status(200).json({ redirectTo: '/gracias' })
  }

  // — Normal Webpay Plus flow —
  try {
    // 2️⃣ Create the transaction
    const buyOrder  = Date.now().toString()
    const sessionId = formularioPrincipal.rut || buyOrder

    const response = await webpayClient.create(
      buyOrder,
      sessionId,
      unit_price,
      `${process.env.SITE_URL}/api/webpay-success` // success
    )

    // 3️⃣ Send the URL & token back to the client
    return res.status(200).json({
      url:   response.url,
      token: response.token
    })
  } catch (err: any) {
    console.error('Webpay init error', err)
    return res.status(500).json({ error: err.message })
  }
}
