import { adminClient, DEFAULT_COLORS } from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { name, numPlayers, language } = req.body || {};

  const poolName = String(name || '').trim().slice(0, 60);
  const n = Number(numPlayers);
  const lang = language === 'de' ? 'de' : 'en';

  if (!poolName) {
    res.status(400).json({ error: 'Pool name is required' });
    return;
  }
  if (!Number.isInteger(n) || n < 2 || n > 12) {
    res.status(400).json({ error: 'numPlayers must be an integer between 2 and 12' });
    return;
  }

  const players = Array.from({ length: n }, (_, i) => ({
    name: `Player ${i + 1}`,
    color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    countries: [],
  }));

  const supabase = adminClient();
  const { data, error } = await supabase
    .from('pools')
    .insert({ name: poolName, num_players: n, language: lang, players, assigned: false })
    .select('id, admin_token')
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ id: data.id, admin_token: data.admin_token });
}
