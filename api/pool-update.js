import { adminClient } from './_supabase.js';
import { assignTeams } from '../team-strength.js';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { id, admin_token, players, runAssigner, name, language } = req.body || {};

  if (!id || !admin_token) {
    res.status(400).json({ error: 'id and admin_token are required' });
    return;
  }

  const supabase = adminClient();
  const { data: pool, error: fetchError } = await supabase
    .from('pools')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !pool) {
    res.status(404).json({ error: 'Pool not found' });
    return;
  }
  if (pool.admin_token !== admin_token) {
    res.status(403).json({ error: 'Invalid admin token' });
    return;
  }

  const update = {};

  if (typeof name === 'string' && name.trim()) {
    update.name = name.trim().slice(0, 60);
  }
  if (language === 'en' || language === 'de') {
    update.language = language;
  }

  let nextPlayers = pool.players;

  if (Array.isArray(players)) {
    if (players.length !== pool.num_players) {
      res.status(400).json({ error: `players must have exactly ${pool.num_players} entries` });
      return;
    }
    nextPlayers = pool.players.map((p, i) => {
      const incoming = players[i] || {};
      const player = { ...p };
      if (typeof incoming.name === 'string' && incoming.name.trim()) {
        player.name = incoming.name.trim().slice(0, 40);
      }
      if (typeof incoming.color === 'string' && HEX_COLOR.test(incoming.color)) {
        player.color = incoming.color;
      }
      return player;
    });
  }

  if (runAssigner) {
    const assignments = assignTeams(pool.num_players);
    nextPlayers = nextPlayers.map((p, i) => ({ ...p, countries: assignments[i] }));
    update.assigned = true;
  }

  if (nextPlayers !== pool.players) {
    update.players = nextPlayers;
  }

  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: 'Nothing to update' });
    return;
  }

  const { data: updated, error: updateError } = await supabase
    .from('pools')
    .update(update)
    .eq('id', id)
    .select('id, name, num_players, players, assigned, language, created_at')
    .single();

  if (updateError) {
    res.status(500).json({ error: updateError.message });
    return;
  }

  res.status(200).json(updated);
}
