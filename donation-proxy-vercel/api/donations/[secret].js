// ============================================================
//  GET /api/donations/:secret?since=TIMESTAMP&limit=10
//  Dipanggil oleh ServerScriptService.Donations.DonationService di Roblox
// ============================================================
const { loadDonations } = require('../../_storage');

const SECRET_KEY = process.env.SECRET_KEY || 'ganti-ini-di-vercel';

module.exports = async (req, res) => {
  const { secret } = req.query;

  if (secret !== SECRET_KEY) {
    return res.status(403).json({ ok: false, error: 'invalid secret key' });
  }

  const since = Number(req.query.since) || 0;
  const limit = Math.min(Number(req.query.limit) || 10, 100);

  try {
    const donations = await loadDonations();

    const filtered = donations
      .filter((d) => d.ts > since)
      .sort((a, b) => a.ts - b.ts)
      .slice(0, limit);

    res.json({ ok: true, donations: filtered });
  } catch (e) {
    console.error('[API ERROR]', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
};
