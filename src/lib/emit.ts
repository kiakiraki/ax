// Output helpers. Default-cap large results so agents don't drown in tokens,
// but NEVER truncate silently — always note what was dropped on stderr.
const DEFAULT_LIMIT = 50
// Rough chars-per-token estimate for --budget (opts.budget is in tokens).
const CHARS_PER_TOKEN = 4

type EmitOpts = { limit?: number; all?: boolean; budget?: number }

function cap<T>(items: T[], opts: EmitOpts, sizeOf: (item: T) => number) {
  let shown = items
  if (!opts.all) {
    const limit = opts.limit ?? DEFAULT_LIMIT
    if (shown.length > limit) shown = shown.slice(0, limit)
  }
  // --budget <tokens>: additionally cut to an estimated token budget.
  if (opts.budget && opts.budget > 0) {
    const maxChars = opts.budget * CHARS_PER_TOKEN
    let used = 0
    let i = 0
    for (; i < shown.length; i++) {
      used += sizeOf(shown[i]!)
      if (used > maxChars && i > 0) break
    }
    shown = shown.slice(0, i)
  }
  return { shown, dropped: items.length - shown.length }
}

function note(dropped: number) {
  if (dropped > 0) {
    process.stderr.write(
      `ax: note: ${dropped} more result(s) hidden (use --all, --limit N, or --budget T)\n`
    )
  }
}

export function emitLines(items: string[], opts: EmitOpts = {}) {
  const { shown, dropped } = cap(items, opts, (s) => s.length + 1)
  if (shown.length) process.stdout.write(shown.join('\n') + '\n')
  note(dropped)
}

export function emitJson(value: unknown, opts: EmitOpts = {}) {
  if (Array.isArray(value)) {
    const { shown, dropped } = cap(value, opts, (v) => JSON.stringify(v).length + 4)
    process.stdout.write(JSON.stringify(shown, null, 2) + '\n')
    note(dropped)
  } else {
    process.stdout.write(JSON.stringify(value, null, 2) + '\n')
  }
}
