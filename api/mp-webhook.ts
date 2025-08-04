import mercadopago from 'mercadopago'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Mercado Pago manda un objeto con { type, data_id }
  const { type, data_id } = req.body

  // Sólo nos importan los eventos de pago
  if (type === 'payment') {
    // 1) obtenemos detalles del pago
    const payment = await mercadopago.payment.get(data_id)
    const { status, preference_id } = payment.body

    console.log('🔔 mp-webhook payment:', { status, preference_id })

    // 2) si NO está aprobado, borramos
    if (status !== 'approved') {
      await fetch(process.env.GAS_URL!, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ action: 'delete', preferenceId: preference_id })
      })
    }
  }

  // respondes siempre 200 para que MP no reintente infinitamente
  res.status(200).send('OK')
  return res.redirect('/error')
}
