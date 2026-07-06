import { parseArgs as nodeParseArgs, type ParseArgsConfig } from 'util'

// Thin wrapper over the built-in util.parseArgs (Bun/Node standard).
// We only reshape its output to { _, flags } and stay non-strict so an
// unknown flag doesn't crash — it just gets ignored.
export type Options = NonNullable<ParseArgsConfig['options']>

export function parseArgs(argv: string[], options: Options) {
  const { values, positionals } = nodeParseArgs({
    args: argv,
    options,
    allowPositionals: true,
    strict: false,
  })
  return { _: positionals, flags: values as Record<string, string | boolean | undefined> }
}

export function num(v: string | boolean | undefined, fallback: number): number {
  if (typeof v !== 'string') return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}
