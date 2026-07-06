import { parseArgs, num } from '../lib/args'
import { readSource, fail } from '../lib/io'
import { emitLines } from '../lib/emit'

export const textHelp = `ax text — line-oriented text processing

usage:
  ax text <file|url|-> [options]

options:
  --grep <pattern>     keep lines matching a regex
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
  })
  if (flags.help) return console.log(textHelp)

  const [src] = _
  const input = await readSource(src)
  const opts = { limit: num(flags.limit, 50), all: flags.all === true }

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
    const matches = [...source.matchAll(re)].map((m) => m[0])
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

  if (flags.count) return void process.stdout.write(lines.length + '\n')

  emitLines(lines, opts)
}
