// ============================================================
//  GET /api/health  -> cek server hidup
// ============================================================
module.exports = (req, res) => {
  res.json({ ok: true, message: 'Donation proxy (Vercel) is running.' });
};
