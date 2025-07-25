import type { VercelRequest, VercelResponse } from '@vercel/node'
import transbank from 'transbank-sdk'

const { WebpayPlus } = transbank

// 1️⃣ Configure your Transbank credentials (integration or production)
WebpayPlus.Transaction.buildForIntegration(
  process.env.TBK_COMMERCE_CODE!,
  process.env.TBK_API_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const {
    unit_price,
    metadata: { formularioPrincipal, entradas },
  } = req.body

  // — “Pagaré después” shortcut for zero‐price entries —
  if (unit_price <= 0) {
    const payload = {
      ...formularioPrincipal,
      entradas,
    }
    await fetch(process.env.GAS_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return res.status(200).json({ redirectTo: '/gracias' })
  }

  // — Normal Webpay Plus flow —
  try {
    const buyOrder  = Date.now().toString()
    const sessionId = formularioPrincipal.rut || buyOrder

    const { token, url } = await WebpayPlus.Transaction.initTransaction(
      buyOrder,
      sessionId,
      unit_price,
      `${process.env.SITE_URL}/api/webpay-success`,  // return URL (browser)
      `${process.env.SITE_URL}/api/webpay-success`   // notify URL (server)
    )

    return res.status(200).json({ token, url })
  } catch (err: any) {
    console.error('Webpay init error', err)
    return res.status(500).json({ error: err.message })
  }
}