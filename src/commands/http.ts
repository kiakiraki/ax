import { parseArgs, num } from '../lib/args'
import { fail } from '../lib/io'

export const httpHelp = `ax http — curl for agents: structured, never silent

usage:
  ax http <url> [options]

options:
  -X, --method <m>     HTTP method (default GET)
  -H, --header <k:v>   request header (repeatable)
  -d, --data <body>    request body (implies POST unless --method given)
  --budget <t>         cap body at ~t tokens (default 500; --all for everything)
  --all                no body cap

Always prints {status, ok, ms, headers, body} — an empty body or an error
status still yields a full report, so there is nothing to guess.
JSON responses are parsed, so the result pipes into ax json.

examples:
  ax http http://localhost:8796/
  ax http https://api.example.com/users -H 'authorization: Bearer x' | ax json - '.body[0]'
  ax http http://localhost:8787/start -X POST -d '{"name":"ax"}' -H 'content-type: application/json'`

export async function http(argv: string[]) {
  const { _, flags } = parseArgs(argv, {
    method: { type: 'string', short: 'X' },
    header: { type: 'string', short: 'H', multiple: true },
    data: { type: 'string', short: 'd' },
    budget: { type: 'string' },
    all: { type: 'boolean' },
    help: { type: 'boolean' },
  })
  if (flags.help || _.length === 0) return console.log(httpHelp)

  const url = _[0]!
  const headers: Record<string, string> = {}
  const headerFlags = (flags.header ?? []) as string[]
  for (const h of headerFlags) {
    const idx = h.indexOf(':')
    if (idx === -1) fail(`bad header (expected 'Name: value'): ${h}`)
    headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim()
  }
  const method =
    typeof flags.method === 'string'
      ? flags.method.toUpperCase()
      : flags.data !== undefined
        ? 'POST'
        : 'GET'

  const started = performance.now()
  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers,
      body: typeof flags.data === 'string' ? flags.data : undefined,
    })
  } catch (e) {
    return fail(`request failed: ${(e as Error).message}`, `is the server running at ${url}?`)
  }
  const ms = Math.round(performance.now() - started)

  const raw = await res.text()
  const budgetTokens = flags.all === true ? Infinity : num(flags.budget, 500)
  const maxChars = budgetTokens * 4
  const truncated = raw.length > maxChars
  const bodyText = truncated ? raw.slice(0, maxChars) : raw

  let body: unknown = bodyText
  const ctype = res.headers.get('content-type') ?? ''
  if (ctype.includes('json') && !truncated) {
    try {
      body = JSON.parse(bodyText)
    } catch {
      /* keep as text */
    }
  }

  process.stdout.write(
    JSON.stringify(
      {
        status: res.status,
        ok: res.ok,
        ms,
        headers: Object.fromEntries(res.headers.entries()),
        body,
        ...(truncated
          ? {
              body_truncated: `${raw.length - maxChars} of ${raw.length} chars hidden (--all or --budget T)`,
            }
          : {}),
      },
      null,
      2
    ) + '\n'
  )
  // Exit explicitly: Bun's fetch keep-alive pool can otherwise keep the
  // process alive after the report is written.
  process.exit(0)
}
