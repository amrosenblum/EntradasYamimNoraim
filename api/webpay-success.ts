import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  WebpayPlus,
  Options
} from 'transbank-sdk'

// 1️⃣ Instantiate a WebpayPlus client for integration (sandbox)
const commerceCode = process.env.TBK_COMMERCE_CODE!
const apiKey       = process.env.TBK_API_KEY!

const webpayClient = new WebpayPlus.Transaction(
  new Options(commerceCode, apiKey, 'INTEGRATION')
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end('Method Not Allowed')
  }

  const token = String(req.query.token_ws || '')

  try {
    const commitResult = await webpayClient.commit(token)  
    const tx = commitResult

    const entradas = JSON.parse(tx.buy_order || '[]')
    const payload = {
      ...tx.card_detail,
      amount: tx.amount,
      status: tx.status,
      entradas
    }

    await fetch(process.env.GAS_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch (err: any) {
    console.error('Webpay confirm error', err)
  }

  res.writeHead(302, { Location: '/gracias' })
  res.end()
}