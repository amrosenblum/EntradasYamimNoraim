// /pages/api/create-webpay.ts
import { VercelRequest, VercelResponse } from '@vercel/node'
import { IntegrationApiKeys, WebpayPlus } from 'transbank-sdk';

const wp: any = WebpayPlus;

wp.configureForProduction('TU_CODIGO_COMERCIO', 'TU_API_KEY');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { buy_order, session_id, amount, return_url } = req.body;

  try {
    const response = await wp.Transaction.create(
      buy_order,
      session_id,
      amount,
      return_url
    );

    res.status(200).json({
      url: response.url,
      token: response.token,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Webpay init error' });
  }
}