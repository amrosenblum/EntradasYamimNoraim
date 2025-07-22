import { VercelRequest, VercelResponse } from '@vercel/node'
import mercadopago from 'mercadopago'

const mp: any = mercadopago;

// Asegúrate de tener definida la variable en .env.local y en Vercel
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

if (!accessToken) {
  throw new Error('MERCADOPAGO_ACCESS_TOKEN not defined in environment variables')
}

// Configurar el cliente MercadoPago
mp.configure({
  access_token: accessToken,
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' })
  }

  try {
    const { title, quantity, unit_price } = req.body

    const preference = {
      items: [
        {
          title,
          quantity,
          currency_id: 'CLP',
          unit_price,
        },
      ],
      back_urls: {
        success: 'https://tusitio.com/success',
        failure: 'https://tusitio.com/failure',
        pending: 'https://tusitio.com/pending',
      },
      auto_return: 'approved',
    }

    const response = await mp.preferences.create(preference)
    return res.status(200).json({ init_point: response.body.init_point })
  } catch (error: any) {
    console.error('MercadoPago Error:', error)
    return res.status(500).json({ error: error.message || 'Failed to create preference' })
  }
}