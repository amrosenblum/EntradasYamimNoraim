// api/create-preferences.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import mercadopago from 'mercadopago'

// keep your v1 setup
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN!
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { title, quantity, unit_price, metadata } = req.body;
  // metadata = { formularioPrincipal: { rut, email, telefono }, entradas: [...] }

  // **Flatten for cero‐pesos (“pagaré después”)**
  if (unit_price <= 0) {
    const { formularioPrincipal, entradas } = metadata;
    // build the exact shape your Apps Script expects:
    const payload = {
      ...formularioPrincipal,   // brings rut, email, telefono up one level
      entradas                  // array of persona objects
    };

    await fetch(process.env.GAS_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return res.status(200).json({ redirectTo: '/gracias' });
  }
  
  // 2) Otherwise, do the normal MercadoPago flow
  try {
    const preference = {
      items:       [{ title, quantity, currency_id: 'CLP', unit_price }],
      back_urls:   {
        success: `${process.env.SITE_URL}/api/mp-success`,
        failure: `${process.env.SITE_URL}/error`
      },
      auto_return: 'approved',
      metadata
    }

    const { body } = await mercadopago.preferences.create(preference)
    return res.status(200).json({ init_point: body.init_point })

  } catch (err: any) {
    console.error('MP Error', err)
    return res.status(500).json({ error: err.message })
  }
}
