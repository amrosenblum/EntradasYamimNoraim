import type { VercelRequest, VercelResponse } from '@vercel/node'
import transbank from 'transbank-sdk'

const { WebpayPlus } = transbank

// Must use the same credentials as in create‑webpay.ts
const transaction = WebpayPlus.Transaction.buildForIntegration(
  process.env.TBK_COMMERCE_CODE!,
  process.env.TBK_API_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end('Method Not Allowed')
  }

  const token = String(req.query.token_ws || '')

  try {
    // 1️⃣ Confirm the transaction
    const tx = await transaction.commit(token)

    // 2️⃣ Build payload for your Apps Script
    const payload = {
      amount:       tx.amount,
      status:       tx.status,
      cardDetail:   tx.card_detail,         // optional
      entradas:     JSON.parse(tx.buy_order || '[]'),
    }

    // 3️⃣ Write to Google Sheets
    await fetch(process.env.GAS_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
  } catch (err: any) {
    console.error('Webpay confirm error', err)
    // you could redirect to an error page here if desired
  }

  // 4️⃣ Redirect the user into your SPA thank‑you route
  res.writeHead(302, { Location: '/gracias' })
  res.end()
}
