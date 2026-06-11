import { adminClient } from './_supabase.js';

const MAX_PENDING_PER_PLAYER = 3;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { id, action } = req.body || {};

  if (!id || !action) {
    res.status(400).json({ error: 'id and action are required' });
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

  if (!pool.trade_mode) {
    res.status(403).json({ error: 'Trade mode is not enabled for this pool' });
    return;
  }

  const players = pool.players || [];
  const trades = pool.trades || [];

  let nextTrades = trades;
  let nextPlayers = players;

  if (action === 'propose') {
    const { fromPlayer, fromCountry, toPlayer, toCountry } = req.body || {};
    const fi = Number(fromPlayer);
    const ti = Number(toPlayer);

    if (!Number.isInteger(fi) || !Number.isInteger(ti) || fi === ti
        || !players[fi] || !players[ti]
        || typeof fromCountry !== 'string' || typeof toCountry !== 'string') {
      res.status(400).json({ error: 'Invalid trade proposal' });
      return;
    }
    if (!(players[fi].countries || []).includes(fromCountry)) {
      res.status(400).json({ error: 'You do not own that country' });
      return;
    }
    if (!(players[ti].countries || []).includes(toCountry)) {
      res.status(400).json({ error: 'The other player does not own that country' });
      return;
    }
    const pendingFromCount = trades.filter(t => t.status === 'pending' && t.fromPlayer === fi).length;
    if (pendingFromCount >= MAX_PENDING_PER_PLAYER) {
      res.status(400).json({ error: `You can only have ${MAX_PENDING_PER_PLAYER} active trade requests at a time` });
      return;
    }

    const trade = {
      id: crypto.randomUUID(),
      fromPlayer: fi,
      fromCountry,
      toPlayer: ti,
      toCountry,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    nextTrades = [...trades, trade];

  } else if (action === 'respond') {
    const { tradeId, accept } = req.body || {};
    const trade = trades.find(t => t.id === tradeId);
    if (!trade || trade.status !== 'pending') {
      res.status(404).json({ error: 'Trade request not found' });
      return;
    }

    if (accept) {
      const fromP = players[trade.fromPlayer];
      const toP = players[trade.toPlayer];
      if (!fromP || !toP
          || !(fromP.countries || []).includes(trade.fromCountry)
          || !(toP.countries || []).includes(trade.toCountry)) {
        res.status(400).json({ error: 'This trade is no longer valid' });
        return;
      }
      nextPlayers = players.map((p, i) => {
        if (i === trade.fromPlayer) {
          return { ...p, countries: p.countries.map(c => c === trade.fromCountry ? trade.toCountry : c) };
        }
        if (i === trade.toPlayer) {
          return { ...p, countries: p.countries.map(c => c === trade.toCountry ? trade.fromCountry : c) };
        }
        return p;
      });
      nextTrades = trades.map(t => t.id === tradeId ? { ...t, status: 'accepted' } : t);
    } else {
      nextTrades = trades.map(t => t.id === tradeId ? { ...t, status: 'rejected' } : t);
    }

  } else if (action === 'cancel') {
    const { tradeId } = req.body || {};
    const trade = trades.find(t => t.id === tradeId);
    if (!trade || trade.status !== 'pending') {
      res.status(404).json({ error: 'Trade request not found' });
      return;
    }
    nextTrades = trades.map(t => t.id === tradeId ? { ...t, status: 'cancelled' } : t);

  } else {
    res.status(400).json({ error: 'Unknown action' });
    return;
  }

  const update = { trades: nextTrades };
  if (nextPlayers !== players) update.players = nextPlayers;

  const { data: updated, error: updateError } = await supabase
    .from('pools')
    .update(update)
    .eq('id', id)
    .select('id, name, num_players, players, assigned, language, trade_mode, trades, created_at')
    .single();

  if (updateError) {
    res.status(500).json({ error: updateError.message });
    return;
  }

  res.status(200).json(updated);
}
