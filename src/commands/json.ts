import { parseArgs, num } from '../lib/args'
import { readSource, fail } from '../lib/io'
import { emitLines, emitJson } from '../lib/emit'

export const jsonHelp = `ax json — query JSON with a small path language (a jq subset)

usage:
  ax json <file|url|-> [path] [options]

path:
  .                identity
  .key             object member
  .a.b.c           nested members
  .items[]         iterate array (or object values) into a stream
  .items[0]        index
  .items[].name    member of every element

options:
  --keys           list the keys of the result (object) or indices (array)
  --len            print the length/size of the result
  --raw            print scalar results as bare lines (not JSON)
  --limit <n>      cap array results (default 50)
  --all            no cap

examples:
  ax json data.json '.items[].name' --raw
  ax json api.json '.data.users[0]'
  cat x.json | ax json - --keys`

type Step = { kind: 'key'; name: string } | { kind: 'iter' } | { kind: 'index'; i: number }

function parsePath(path: string): Step[] {
  if (path === '' || path === '.') return []
  const steps: Step[] = []
  const re = /\.([A-Za-z_$][\w$]*)|\[(\d+)\]|\[\]/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(path)) !== null) {
    if (m.index !== last) fail(`cannot parse path near: ${path.slice(last)}`)
    if (m[1] !== undefined) steps.push({ kind: 'key', name: m[1] })
    else if (m[2] !== undefined) steps.push({ kind: 'index', i: Number(m[2]) })
    else steps.push({ kind: 'iter' })
    last = re.lastIndex
  }
  if (last !== path.length) fail(`cannot parse path near: ${path.slice(last)}`)
  return steps
}

function typeOf(v: unknown): string {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v
}

function apply(stream: unknown[], step: Step): unknown[] {
  const out: unknown[] = []
  for (const v of stream) {
    if (step.kind === 'key') {
      if (typeOf(v) !== 'object') fail(`cannot index ${typeOf(v)} with "${step.name}"`)
      out.push((v as Record<string, unknown>)[step.name] ?? null)
    } else if (step.kind === 'index') {
      if (!Array.isArray(v)) fail(`cannot index ${typeOf(v)} with [${step.i}]`)
      out.push(v[step.i] ?? null)
    } else {
      if (Array.isArray(v)) out.push(...v)
      else if (typeOf(v) === 'object') out.push(...Object.values(v as object))
      else fail(`cannot iterate ${typeOf(v)} with []`)
    }
  }
  return out
}

export async function json(argv: string[]) {
  const { _, flags } = parseArgs(argv, {
    keys: { type: 'boolean' },
    len: { type: 'boolean' },
    raw: { type: 'boolean' },
    all: { type: 'boolean' },
    help: { type: 'boolean' },
    limit: { type: 'string' },
  })
  if (flags.help) return console.log(jsonHelp)

  const [src, path] = _
  let root: unknown
  try {
    root = JSON.parse(await readSource(src))
  } catch (e) {
    return fail(`invalid JSON: ${(e as Error).message}`)
  }

  const steps = parsePath(path ?? '.')
  let stream: unknown[] = [root]
  for (const step of steps) stream = apply(stream, step)

  // Collapse the stream: a single value stays scalar; many become an array.
  const result: unknown = stream.length === 1 ? stream[0] : stream
  const opts = { limit: num(flags.limit, 50), all: flags.all === true }

  if (flags.keys) {
    const keys = Array.isArray(result)
      ? result.map((_, i) => String(i))
      : typeOf(result) === 'object'
        ? Object.keys(result as object)
        : fail(`cannot list keys of ${typeOf(result)}`)
    return emitLines(keys, opts)
  }

  if (flags.len) {
    const len = Array.isArray(result)
      ? result.length
      : typeOf(result) === 'object'
        ? Object.keys(result as object).length
        : typeof result === 'string'
          ? result.length
          : fail(`cannot take length of ${typeOf(result)}`)
    return process.stdout.write(len + '\n')
  }

  if (flags.raw) {
    const arr = Array.isArray(result) ? result : [result]
    const lines = arr.map((v) =>
      typeOf(v) === 'object' || Array.isArray(v) ? JSON.stringify(v) : String(v)
    )
    return emitLines(lines, opts)
  }

  return emitJson(result, opts)
}
