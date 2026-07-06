import { fail } from './io'
import { emitLines, emitJson } from './emit'
import { num } from './args'
import { compileWhere } from './expr'

// The jq-subset path language shared by `ax json` and `ax yaml`.

type Step = { kind: 'key'; name: string } | { kind: 'iter' } | { kind: 'index'; i: number }

function parsePath(path: string): Step[] {
  // jq-compat: `.[0]` / `.["k"]` / `.[]` are the same as `[0]` / `["k"]` / `[]`.
  path = path.replace(/\.(?=\[)/g, '')
  if (path === '' || path === '.') return []
  const steps: Step[] = []
  const re = /\.([A-Za-z_$][\w$-]*)|\["([^"]+)"\]|\[(\d+)\]|\[\]/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(path)) !== null) {
    if (m.index !== last) fail(`cannot parse path near: ${path.slice(last)}`)
    if (m[1] !== undefined) steps.push({ kind: 'key', name: m[1] })
    else if (m[2] !== undefined) steps.push({ kind: 'key', name: m[2] })
    else if (m[3] !== undefined) steps.push({ kind: 'index', i: Number(m[3]) })
    else steps.push({ kind: 'iter' })
    last = re.lastIndex
  }
  if (last !== path.length) fail(`cannot parse path near: ${path.slice(last)}`)
  return steps
}

export function typeOf(v: unknown): string {
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

export function runQuery(root: unknown, path: string | undefined): unknown {
  let stream: unknown[] = [root]
  for (const step of parsePath(path ?? '.')) stream = apply(stream, step)
  // Collapse the stream: a single value stays scalar; many become an array.
  return stream.length === 1 ? stream[0] : stream
}

// Shared output handling for the query commands (--keys / --len / --raw).
export function emitQueryResult(
  result: unknown,
  flags: Record<string, string | boolean | undefined>
) {
  const opts = { limit: num(flags.limit, 50), all: flags.all === true }

  if (typeof flags.where === 'string') {
    if (!Array.isArray(result)) fail('--where needs an array result', 'iterate with [] first')
    result = result.filter(compileWhere(flags.where))
  }

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
    return void process.stdout.write(len + '\n')
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

export const queryFlagDefs = {
  keys: { type: 'boolean' },
  len: { type: 'boolean' },
  raw: { type: 'boolean' },
  all: { type: 'boolean' },
  help: { type: 'boolean' },
  limit: { type: 'string' },
  where: { type: 'string' },
} as const
