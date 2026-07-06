// Deterministic fixtures for the json / text benchmarks.
const countries = ['JP', 'US', 'DE', 'BR', 'IN', 'FR', 'KE']
const names = ['sato', 'suzuki', 'tanaka', 'kim', 'lee', 'muller', 'silva', 'patel', 'diaz', 'okoro']

// users.json — 600 users, nested-ish API export shape
const users = Array.from({ length: 600 }, (_, k) => {
  const i = k + 1
  return {
    id: i,
    name: `${names[i % 10]}-${i}`,
    email: `${names[i % 10]}${i}@example.com`,
    age: 20 + ((i * 7) % 40),
    active: i % 3 !== 0,
    country: countries[i % 7],
    plan: i % 5 === 0 ? 'pro' : 'free',
  }
})
await Bun.write(
  'bench/users.json',
  JSON.stringify({ meta: { total: 600, exported: '2026-07-01' }, users }, null, 1)
)

// app.log — 6000 lines of production-ish logs
const lines: string[] = []
for (let i = 1; i <= 6000; i++) {
  const ts = `2026-07-06T${String(8 + (i % 12)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}Z`
  const req = `req-${1000 + (i % 137)}`
  if (i % 13 === 0) {
    const code = `E${100 + (i % 9)}`
    lines.push(`${ts} ERROR [${code}] ${req} upstream timeout after ${(i % 5) + 1}00ms`)
  } else if (i % 7 === 0) {
    lines.push(`${ts} WARN ${req} slow query took ${(i % 9) + 1}00ms table=orders`)
  } else {
    lines.push(`${ts} INFO ${req} GET /api/items/${i % 50} 200 ${(i % 40) + 5}ms`)
  }
}
await Bun.write('bench/app.log', lines.join('\n') + '\n')

console.log('wrote bench/users.json and bench/app.log')
