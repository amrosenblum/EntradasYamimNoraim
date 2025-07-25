import type { VercelRequest, VercelResponse } from '@vercel/node'
import { WebpayPlus } from 'transbank-sdk'

// 1️⃣ configure your sandbox or prod credentials
WebpayPlus.configureForIntegration(
  process.env.TBK_COMMERCE_CODE!,
  process.env.TBK_API_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const { unit_price, metadata: { formularioPrincipal, entradas } } = req.body

  // Zero‑price shortcut (“pagaré después”)
  if (unit_price <= 0) {
    await fetch(process.env.GAS_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...formularioPrincipal,
        entradas 
      })
    })
    return res.status(200).json({ redirectTo: '/gracias' })
  }

  try {
    // 2️⃣ Kick off Webpay Plus
    const buyOrder  = Date.now().toString()
    const sessionId = formularioPrincipal.rut || buyOrder

    const { url, token } = await WebpayPlus.Transaction.initTransaction(
      buyOrder,
      sessionId,
      unit_price,
      `${process.env.SITE_URL}/api/webpay-success`, // returnUrl (user comes back here)
      `${process.env.SITE_URL}/api/webpay-success`  // finalUrl (in case of server-to-server callback)
    )

    return res.status(200).json({ url, token })

  } catch (err: any) {
    console.error('Webpay init error', err)
    return res.status(500).json({ error: err.message })
  }
}
