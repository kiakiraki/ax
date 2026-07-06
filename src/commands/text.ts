import { parseArgs, num } from '../lib/args'
import { readSource, fail } from '../lib/io'
import { emitLines } from '../lib/emit'

export const textHelp = `ax text — line-oriented text processing

usage:
  ax text <file|url|-> [options]

options:
  --grep <pattern>   keep lines matching a regex
  --invert           with --grep, keep NON-matching lines
  -i, --ignore-case  case-insensitive --grep
  --count            print only the number of matching lines
  --head <n>         first n lines
  --tail <n>         last n lines
  --limit <n>        cap output lines (default 50)
  --all              no cap

examples:
  ax text app.log --grep 'ERROR|WARN' --count
  ax text README.md --head 20
  cat data.txt | ax text - --grep '^\\d+' -i`

export async function text(argv: string[]) {
  const { _, flags } = parseArgs(argv, {
    grep: { type: 'string' },
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
  let lines = (await readSource(src)).split('\n')
  // Drop a single trailing empty line from the final newline.
  if (lines.length && lines[lines.length - 1] === '') lines.pop()

  if (typeof flags.grep === 'string') {
    let re: RegExp
    try {
      re = new RegExp(flags.grep, flags['ignore-case'] ? 'i' : '')
    } catch (e) {
      return fail(`invalid regex: ${(e as Error).message}`)
    }
    lines = lines.filter((l) => re.test(l) !== (flags.invert === true))
  }

  if (typeof flags.head === 'string') lines = lines.slice(0, num(flags.head, 10))
  if (typeof flags.tail === 'string') lines = lines.slice(-num(flags.tail, 10))

  if (flags.count) return process.stdout.write(lines.length + '\n')

  emitLines(lines, { limit: num(flags.limit, 50), all: flags.all === true })
}
