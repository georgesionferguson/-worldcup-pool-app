const TOKEN='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjlkZDY1OWFkMDI4MjY1YjE4NjhhZSIsImlhdCI6MTc4MTEyODU1MCwiZXhwIjoxNzg4Mzg2MTUwfQ.DM3ptWr9V5RJDpH8Jokr9uqxdIZjFjdW8ageq9Or-aw';

export default async function handler(req, res) {
  try {
    const r = await fetch('https://worldcup26.ir/get/games', {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    if (!r.ok) {
      res.status(r.status).json({ error: `Upstream API ${r.status}` });
      return;
    }
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
