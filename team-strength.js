// Team strength ratings derived from FIFA World Ranking points
// (10 June 2026, football-ranking.com). Used purely to seed the
// random team assigner so each player gets a balanced spread of
// strong/weak teams, regardless of how many players there are.
export const TEAM_STRENGTH = {
  'France':1870.69, 'Spain':1873.87, 'Argentina':1876.11, 'England':1827.05,
  'Portugal':1766.17, 'Brazil':1765.86, 'Netherlands':1753.57, 'Germany':1735.77,
  'Morocco':1755.44, 'Belgium':1742.23,
  'Colombia':1698.35, 'Uruguay':1673.07, 'Senegal':1685.24, 'Japan':1661.58,
  'Norway':1557.44, 'Mexico':1687.48, 'USA':1671.24, 'Canada':1559.48,
  'Korea Republic':1591.63, 'Ecuador':1598.51,
  'Switzerland':1650.07, 'Croatia':1714.87, 'Türkiye':1605.73, 'Austria':1597.41,
  'Algeria':1571.04, 'Ivory Coast':1540.87, 'Australia':1579.34, 'Sweden':1509.79,
  'Egypt':1562.37, 'Scotland':1503.34,
  'Czechia':1505.74, 'Bosnia':1387.22, 'Tunisia':1476.40, 'Paraguay':1505.35,
  'Ghana':1346.88, 'Saudi Arabia':1422.71, 'South Africa':1432.71, 'Iraq':1451.16,
  'Panama':1539.15, 'Iran':1619.58,
  'Qatar':1450.31, 'Jordan':1387.73, 'Uzbekistan':1458.73, 'Congo DR':1477.06,
  'New Zealand':1275.58, 'Cabo Verde':1371.11, 'Curaçao':1294.77, 'Haiti':1293.09,
};

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Splits the teams into `numPlayers` equal-sized strength "bands"
// (sorted strongest-first), then deals each band round-robin to the
// players, balancing running totals so everyone ends up with the same
// number of teams. If 48 doesn't divide evenly by `numPlayers`, the
// weakest teams are duplicated (so two players can share the same
// lowest-tier team) to make up the difference.
export function assignTeams(numPlayers) {
  const sorted = Object.keys(TEAM_STRENGTH).sort((a, b) => TEAM_STRENGTH[b] - TEAM_STRENGTH[a]);
  const perPlayer = Math.ceil(sorted.length / numPlayers);
  const targetTotal = perPlayer * numPlayers;
  const teams = [...sorted];
  for (let i = 0; teams.length < targetTotal; i++) {
    teams.push(sorted[sorted.length - 1 - i]);
  }
  teams.sort((a, b) => TEAM_STRENGTH[b] - TEAM_STRENGTH[a]);

  const bands = [];
  for (let i = 0; i < numPlayers; i++) {
    bands.push(teams.slice(i * perPlayer, (i + 1) * perPlayer));
  }

  const assignments = Array.from({ length: numPlayers }, () => []);
  const counts = Array(numPlayers).fill(0);
  bands.forEach(band => {
    const shuffled = shuffle([...band]);
    const order = shuffle(Array.from({ length: numPlayers }, (_, i) => i))
      .sort((a, b) => counts[a] - counts[b]);
    shuffled.forEach((team, i) => {
      const p = order[i % numPlayers];
      assignments[p].push(team);
      counts[p]++;
    });
  });
  return assignments;
}
