import { parseArgs, num } from '../lib/args'
import { readSource, fail } from '../lib/io'
import { emitLines } from '../lib/emit'

export const textHelp = `ax text — line-oriented text processing

usage:
  ax text <file|url|-> [options]

options:
  --grep <pattern>     keep lines matching a regex
  --like <query>       semantic grep: rank lines by meaning, not regex
                       (local quantized MiniLM — offline after one-time
                       download; composes with --grep as a prefilter)
  --min <score>        with --like, drop lines scoring below this (0..1)
  --extract <pattern>  emit each regex match, not lines (grep -o);
                       composes with --grep (extracts from matching lines only)
  --freq               with --extract, frequency table (uniq -c, sorted)
  --invert             with --grep, keep NON-matching lines
  -i, --ignore-case    case-insensitive matching
  --count              print only the number of matches
  --head <n>           first n lines
  --tail <n>           last n lines
  --limit <n>          cap output lines (default 50)
  --all                no cap

examples:
  ax text app.log --grep 'ERROR|WARN' --count
  ax text tickets.txt --like 'shipping complaints' --limit 10
  ax text style.css --extract '#[0-9a-fA-F]{3,8}' --freq
  ax text README.md --head 20
  cat data.txt | ax text - --grep '^\\d+' -i`

function compile(pattern: string, flags: string): RegExp {
  try {
    return new RegExp(pattern, flags)
  } catch (e) {
    return fail(`invalid regex: ${(e as Error).message}`)
  }
}

export async function text(argv: string[]) {
  const { _, flags } = parseArgs(argv, {
    grep: { type: 'string' },
    extract: { type: 'string' },
    freq: { type: 'boolean' },
    invert: { type: 'boolean' },
    'ignore-case': { type: 'boolean', short: 'i' },
    count: { type: 'boolean' },
    head: { type: 'string' },
    tail: { type: 'string' },
    limit: { type: 'string' },
    all: { type: 'boolean' },
    help: { type: 'boolean' },
    fresh: { type: 'boolean' },
    like: { type: 'string' },
    min: { type: 'string' },
    budget: { type: 'string' },
  })
  if (flags.help) return console.log(textHelp)

  const [src] = _
  const input = await readSource(src)
  const opts = {
    limit: num(flags.limit, 50),
    all: flags.all === true,
    budget: num(flags.budget, 0),
  }

  // --extract: pull out every regex match (grep -o), optionally as a
  // frequency table (--freq) — the sort | uniq -c | sort -rn idiom built in.
  // Composes with --grep: extraction runs only on matching lines.
  if (typeof flags.extract === 'string') {
    let source = input
    if (typeof flags.grep === 'string') {
      const lineRe = compile(flags.grep, flags['ignore-case'] ? 'i' : '')
      source = input
        .split('\n')
        .filter((l) => lineRe.test(l) !== (flags.invert === true))
        .join('\n')
    }
    const re = compile(flags.extract, flags['ignore-case'] ? 'gi' : 'g')
    // Capture-group semantics: /took (\d+)ms/ emits the group, not the match.
    const matches = [...source.matchAll(re)].map((m) => m[1] ?? m[0])
    if (flags.count) return void process.stdout.write(matches.length + '\n')
    if (flags.freq) {
      const counts = new Map<string, number>()
      for (const m of matches) counts.set(m, (counts.get(m) ?? 0) + 1)
      const lines = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([v, n]) => `${String(n).padStart(7)}  ${v}`)
      return emitLines(lines, opts)
    }
    return emitLines(matches, opts)
  }

  let lines = input.split('\n')
  // Drop a single trailing empty line from the final newline.
  if (lines.length && lines[lines.length - 1] === '') lines.pop()

  if (typeof flags.grep === 'string') {
    const re = compile(flags.grep, flags['ignore-case'] ? 'i' : '')
    lines = lines.filter((l) => re.test(l) !== (flags.invert === true))
  }

  if (typeof flags.head === 'string') lines = lines.slice(0, num(flags.head, 10))
  if (typeof flags.tail === 'string') lines = lines.slice(-num(flags.tail, 10))

  // --like: semantic grep. Ranks (grep-prefiltered) lines by meaning using a
  // local quantized embedding model — the query regex can't express.
  if (typeof flags.like === 'string') {
    const { rankBySimilarity } = await import('../lib/embed')
    const candidates = lines.filter((l) => l.trim().length > 0)
    if (candidates.length === 0) fail('no lines to rank')
    if (candidates.length > 2000) {
      process.stderr.write(
        `ax: note: embedding ${candidates.length} lines — a --grep prefilter would be faster\n`
      )
    }
    const ranked = await rankBySimilarity(flags.like, candidates)
    const minScore = typeof flags.min === 'string' ? Number(flags.min) : -Infinity
    const out = ranked
      .filter((r) => r.score >= minScore)
      .map((r) => `${r.score.toFixed(3)}  ${r.line}`)
    emitLines(out, opts)
    // The wasm runtime's thread pool would otherwise keep the process alive.
    process.exit(0)
  }

  // --freq without --extract: frequency table of whole lines (sort | uniq -c).
  if (flags.freq) {
    const counts = new Map<string, number>()
    for (const l of lines) counts.set(l, (counts.get(l) ?? 0) + 1)
    const freqLines = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([v, n]) => `${String(n).padStart(7)}  ${v}`)
    return emitLines(freqLines, opts)
  }

  if (flags.count) return void process.stdout.write(lines.length + '\n')

  emitLines(lines, opts)
}
