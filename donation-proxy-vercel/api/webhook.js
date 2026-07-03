// ============================================================
//  POST /api/webhook
//  Diatur di: bagibagi.co/stream-overlay -> tab Integrasi -> Custom Webhook Url
//  URL yang dimasukkan ke BagiBagi: https://NAMA-PROJECT-KAMU.vercel.app/api/webhook
// ============================================================
const crypto = require('crypto');
const { loadDonations, saveDonations } = require('../_storage');

const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || '';

function isValidSignature(rawBody, signature) {
  if (!WEBHOOK_TOKEN) {
    console.warn('[WARN] WEBHOOK_TOKEN belum diset, signature tidak divalidasi!');
    return true;
  }
  if (!signature) return false;
  try {
    const generated = crypto.createHmac('sha256', WEBHOOK_TOKEN).update(rawBody).digest('hex');
    const sigBuf = Buffer.from(signature, 'hex');
    const genBuf = Buffer.from(generated, 'hex');
    if (sigBuf.length !== genBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, genBuf);
  } catch (e) {
    return false;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method not allowed' });
  }

  // Vercel biasanya sudah parse JSON body ke req.body,
  // tapi kita juga butuh raw body (string) untuk verifikasi signature.
  const rawBody = JSON.stringify(req.body);
  const signature = req.headers['x-bagibagi-signature'];

  if (!isValidSignature(rawBody, signature)) {
    console.warn('[WEBHOOK] Signature tidak valid, ditolak.');
    return res.status(401).json({ ok: false, error: 'invalid signature' });
  }

  const body = req.body || {};
  const id = body.transaction_id || `manual-${Date.now()}`;

  try {
    const donations = await loadDonations();

    const alreadyExists = donations.some((d) => d.id === id);
    if (alreadyExists) {
      console.log('[WEBHOOK] Donasi duplikat, diabaikan:', id);
      return res.json({ ok: true, duplicate: true });
    }

    const entry = {
      id,
      donor: body.name || 'Anonymous',
      amount: Number(body.amount) || 0,
      message: body.message || '',
      ts: Date.now(),
    };

    donations.push(entry);
    await saveDonations(donations);

    console.log(`[WEBHOOK] Donasi baru: ${entry.donor} - Rp${entry.amount} (${entry.message})`);
    res.json({ ok: true });
  } catch (e) {
    console.error('[WEBHOOK ERROR]', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
};
