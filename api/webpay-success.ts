// api/webpay-success.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { WebpayPlus } from 'transbank-sdk'

// Re‑configure with the **same** credentials
WebpayPlus.configureForIntegration(
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
    // 3️⃣ Confirm the transaction
    const tx = await WebpayPlus.Transaction.getTransactionResult(token)

    // Build payload however your Apps Script expects it:
    const payload = {
      amount: tx.amount,
      status: tx.status,
      cardDetail: tx.card_detail,
      entradas: JSON.parse(tx.buy_order || '[]')
    }

    await fetch(process.env.GAS_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch (err: any) {
    console.error('Webpay confirm error', err)
  }

  // 4️⃣ Redirect user to your thanks page
  res.writeHead(302, { Location: '/gracias' })
  res.end()
}