// Generate a realistic lesson-list page (and a lightly-mutated variant)
// so the benchmark runs against non-trivial, messy-ish markup.
const levels = ['A1', 'A2', 'B1', 'B2', 'C1']
const titles = [
  'Greetings',
  'Small talk',
  'Ordering food',
  'Directions',
  'Job interview',
  'Debate practice',
  'Phone calls',
  'Travel plans',
  'Weather',
  'Shopping',
]

function page(mutate: boolean): string {
  const rows: string[] = []
  for (let i = 1; i <= 300; i++) {
    const lvl = levels[i % levels.length]
    const title = titles[i % titles.length]
    // The mutated variant reorders attributes and adds a nested <b>,
    // which is exactly the kind of change that breaks hand-rolled regex.
    const a = mutate
      ? `<a data-id="${i}" href="/lesson/${i}.htm">Lesson ${i}: <b>${title}</b></a>`
      : `<a href="/lesson/${i}.htm" data-id="${i}">Lesson ${i}: ${title}</a>`
    rows.push(`    <li class="lesson">${a}<span class="cefr">${lvl}</span></li>`)
  }
  return `<!doctype html>
<html><head><title>Lessons</title></head>
<body>
  <nav><a href="/">Home</a> <a href="/about">About</a></nav>
  <ul class="lessons">
${rows.join('\n')}
  </ul>
</body></html>
`
}

await Bun.write('bench/sample.html', page(false))
await Bun.write('bench/sample-mutated.html', page(true))
console.log('wrote bench/sample.html and bench/sample-mutated.html')
