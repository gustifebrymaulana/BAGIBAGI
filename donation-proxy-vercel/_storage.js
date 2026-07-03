// ============================================================
//  Helper penyimpanan data pakai Upstash Redis (REST API)
//  Gratis, tanpa kartu kredit: https://upstash.com
// ============================================================
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const STORAGE_KEY = 'donations_rupiah';

async function upstashGet(key) {
  const res = await fetch(`${UPSTASH_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });
  const data = await res.json();
  return data.result; // string atau null
}

async function upstashSet(key, value) {
  const res = await fetch(`${UPSTASH_URL}/set/${key}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    body: value,
  });
  return res.json();
}

async function loadDonations() {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    throw new Error('UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN belum diset di Environment Variables Vercel.');
  }
  const raw = await upstashGet(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

async function saveDonations(list) {
  // Batasi 2000 entri terakhir biar data tidak membengkak selamanya
  const trimmed = list.length > 2000 ? list.slice(list.length - 2000) : list;
  await upstashSet(STORAGE_KEY, JSON.stringify(trimmed));
}

module.exports = { loadDonations, saveDonations };
