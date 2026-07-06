// Output helpers. Default-cap large results so agents don't drown in tokens,
// but NEVER truncate silently — always note what was dropped on stderr.
const DEFAULT_LIMIT = 50

type EmitOpts = { limit?: number; all?: boolean }

function cap<T>(items: T[], opts: EmitOpts): { shown: T[]; dropped: number } {
  if (opts.all) return { shown: items, dropped: 0 }
  const limit = opts.limit ?? DEFAULT_LIMIT
  if (items.length <= limit) return { shown: items, dropped: 0 }
  return { shown: items.slice(0, limit), dropped: items.length - limit }
}

function note(dropped: number) {
  if (dropped > 0) {
    process.stderr.write(`ax: note: ${dropped} more result(s) hidden (use --all or --limit N)\n`)
  }
}

export function emitLines(items: string[], opts: EmitOpts = {}) {
  const { shown, dropped } = cap(items, opts)
  if (shown.length) process.stdout.write(shown.join('\n') + '\n')
  note(dropped)
}

export function emitJson(value: unknown, opts: EmitOpts = {}) {
  if (Array.isArray(value)) {
    const { shown, dropped } = cap(value, opts)
    process.stdout.write(JSON.stringify(shown, null, 2) + '\n')
    note(dropped)
  } else {
    process.stdout.write(JSON.stringify(value, null, 2) + '\n')
  }
}
