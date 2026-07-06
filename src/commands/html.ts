import { parseHTML } from 'linkedom'
import { parseArgs, num } from '../lib/args'
import { readSource, fail } from '../lib/io'
import { emitLines, emitJson } from '../lib/emit'
import { compileWhere } from '../lib/expr'
import { toTsv } from '../lib/query'

export const htmlHelp = `ax html — extract from HTML with CSS selectors (no regex, no broken markup)

usage:
  ax html <file|url|-> <selector> [options]

options:
  --text            emit each match's text content (default)
  --attr <name>     emit an attribute value (e.g. --attr href)
  --html            emit each match's inner HTML
  --json            emit a JSON array of {text, html, attrs}
  --row <spec>      extract structured rows: 'name=sel, name2=sel@attr, ...'
                    sel is relative to each match; @attr reads an attribute;
                    an empty sel (e.g. id=@data-id) targets the match itself
  --table           parse <table> into rows keyed by headers
                    (selector optional; defaults to every table on the page)
  --where <expr>    filter --row/--table rows: level ~ /^A/ && title != ''
  --limit <n>       cap results (default 50)
  --all             no cap

discovery (explore an unknown page without dumping raw HTML):
  --outline         list repeating tag.class signatures with counts
  --count           print how many elements the selector matches
  --locate <text>   find which selector(s) contain a piece of text

examples:
  ax html page.html '.lesson a' --attr href
  ax html https://example.com 'h2' --text
  ax html page.html '.lesson' --row 'title=a, href=a@href, level=.cefr'
  ax html https://site.com/ --outline
  ax html https://site.com/ --locate 'BurgerBarn'
  ax html page.html '.card' --count`

type Field = { name: string; sel: string; attr: string | null }

// Parse a --row spec like "title=a, href=a@href, id=@data-id" into fields.
// Each entry is name=selector, where selector may end with @attribute.
function parseRowSpec(spec: string): Field[] {
  return spec
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => {
      const eq = part.indexOf('=')
      if (eq === -1) fail(`bad --row field (expected name=selector): ${part}`)
      const name = part.slice(0, eq).trim()
      let sel = part.slice(eq + 1).trim()
      let attr: string | null = null
      const at = sel.indexOf('@')
      if (at !== -1) {
        attr = sel.slice(at + 1).trim()
        sel = sel.slice(0, at).trim()
      }
      if (!name) fail(`bad --row field (missing name): ${part}`)
      return { name, sel, attr }
    })
}

const collapse = (s: string) => s.trim().replace(/\s+/g, ' ')

// One compact signature for an element: tag + classes (e.g. div.card.wide).
function signature(el: Element): string {
  const classes = [...el.classList]
  return el.localName + (classes.length ? '.' + classes.join('.') : '')
}

// Build a compact CSS-ish path from <body> down to an element, so --locate
// can answer "where does this text live?" with a selector, not raw bytes.
function selectorPath(el: Element): string {
  const parts: string[] = []
  let node: Element | null = el
  while (node && node.localName !== 'body' && node.localName !== 'html') {
    parts.unshift(node.id ? `${node.localName}#${node.id}` : signature(node))
    node = node.parentElement
  }
  return parts.join(' > ')
}

export async function html(argv: string[]) {
  const { _, flags } = parseArgs(argv, {
    text: { type: 'boolean' },
    html: { type: 'boolean' },
    json: { type: 'boolean' },
    all: { type: 'boolean' },
    help: { type: 'boolean' },
    outline: { type: 'boolean' },
    count: { type: 'boolean' },
    attr: { type: 'string' },
    row: { type: 'string' },
    locate: { type: 'string' },
    limit: { type: 'string' },
    table: { type: 'boolean' },
    where: { type: 'string' },
    tsv: { type: 'boolean' },
    budget: { type: 'string' },
  })
  if (flags.help) return console.log(htmlHelp)
  const wherePred = typeof flags.where === 'string' ? compileWhere(flags.where) : null

  const [src, selector] = _
  const { document } = parseHTML(await readSource(src))
  const opts = {
    limit: num(flags.limit, 50),
    all: flags.all === true,
    budget: num(flags.budget, 0),
  }
  const scope = (): ParentNode => {
    if (!selector) return document.querySelector('body') ?? document
    const el = document.querySelector(selector)
    if (!el) fail(`selector matched nothing: ${selector}`)
    return el
  }

  // --outline: discover the repeating structure (tag.class signatures + counts).
  // Selector is optional and scopes the scan.
  if (flags.outline) {
    const counts = new Map<string, number>()
    for (const el of scope().querySelectorAll('*')) {
      const sig = signature(el)
      counts.set(sig, (counts.get(sig) ?? 0) + 1)
    }
    const lines = [...counts.entries()]
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([sig, n]) => `${String(n).padStart(5)}  ${sig}`)
    return emitLines(lines, opts)
  }

  // --locate <text>: find where a string lives (own text or attribute value),
  // and report a selector path + a short snippet (agent-native peek).
  if (typeof flags.locate === 'string') {
    const needle = flags.locate.toLowerCase()
    const hits: { selector: string; match: string }[] = []
    for (const el of scope().querySelectorAll('*')) {
      // Match on an attribute value (like the agent grepping raw HTML)...
      const attrHit = el
        .getAttributeNames()
        .map((n) => [n, el.getAttribute(n) ?? ''] as const)
        .find(([, v]) => v.toLowerCase().includes(needle))
      // ...or on this element's own text, keeping only the innermost text match.
      const childHit = [...el.children].some((c) =>
        (c.textContent ?? '').toLowerCase().includes(needle)
      )
      const textHit = !childHit && (el.textContent ?? '').toLowerCase().includes(needle)
      if (!attrHit && !textHit) continue
      const snippet = attrHit ? `${attrHit[0]}="${attrHit[1]}"` : collapse(el.textContent ?? '')
      hits.push({
        selector: selectorPath(el),
        match: snippet.length > 80 ? snippet.slice(0, 80) + '…' : snippet,
      })
    }
    if (hits.length === 0) fail(`text not found: ${flags.locate}`)
    return emitJson(hits, opts)
  }

  // --table: turn <table> elements into structured rows. Headers come from
  // thead th (or the first row); each body row becomes {header: cell}.
  // rowspan/colspan are not expanded.
  if (flags.table) {
    const tables = [...document.querySelectorAll(selector ?? 'table')].filter(
      (el) => el.localName === 'table' || (el.querySelector('table') && el.localName !== 'table')
    )
    const targets = tables.flatMap((el) =>
      el.localName === 'table' ? [el] : [...el.querySelectorAll('table')]
    )
    if (targets.length === 0) fail(`no <table> found${selector ? ` under: ${selector}` : ''}`)

    const parse = (table: Element) => {
      const allRows = [...table.querySelectorAll('tr')]
      if (allRows.length === 0) return { headers: [], rows: [] }
      const headerCells = [...(allRows[0]?.querySelectorAll('th') ?? [])]
      const hasHeader = headerCells.length > 0
      const headers = hasHeader
        ? headerCells.map((c, i) => collapse(c.textContent ?? '') || `col${i}`)
        : [...(allRows[0]?.querySelectorAll('td') ?? [])].map((_, i) => `col${i}`)
      const dataRows = hasHeader ? allRows.slice(1) : allRows
      const rows = dataRows
        .map((tr) => {
          const cells = [...tr.querySelectorAll('th, td')].map((c) => collapse(c.textContent ?? ''))
          return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? null]))
        })
        // Drop all-empty rows (e.g. secondary header rows, spacer rows).
        .filter((r) => Object.values(r).some((v) => v))
      return { headers, rows }
    }

    const parsed = targets.map(parse)
    if (wherePred) for (const p of parsed) p.rows = p.rows.filter(wherePred)
    // One table → just its rows; several → keep them separate.
    const tableResult = parsed.length === 1 ? parsed[0]!.rows : parsed
    if (flags.tsv) return emitLines(toTsv(tableResult), opts)
    return emitJson(tableResult, opts)
  }

  // Everything below needs a selector.
  if (!selector) fail('missing selector', 'ax html <file|url|-> <selector>')

  const els = [...document.querySelectorAll(selector)]
  if (els.length === 0) fail(`selector matched nothing: ${selector}`)

  // --count: just how many elements match (probe a hypothesis cheaply).
  if (flags.count) return void process.stdout.write(els.length + '\n')

  if (typeof flags.row === 'string') {
    const fields = parseRowSpec(flags.row)
    const rows = els.map((el) => {
      const obj: Record<string, string | null> = {}
      for (const f of fields) {
        const target = f.sel === '' ? el : el.querySelector(f.sel)
        if (!target) {
          obj[f.name] = null
        } else if (f.attr) {
          obj[f.name] = target.getAttribute(f.attr)
        } else {
          obj[f.name] = collapse(target.textContent ?? '')
        }
      }
      return obj
    })
    const rowResult = wherePred ? rows.filter(wherePred) : rows
    if (flags.tsv) return emitLines(toTsv(rowResult), opts)
    return emitJson(rowResult, opts)
  }

  if (flags.json) {
    const rows = els.map((el) => ({
      text: (el.textContent ?? '').trim(),
      html: el.innerHTML,
      attrs: Object.fromEntries(el.getAttributeNames().map((n) => [n, el.getAttribute(n) ?? ''])),
    }))
    return emitJson(rows, opts)
  }

  if (typeof flags.attr === 'string') {
    const vals = els
      .map((el) => el.getAttribute(flags.attr as string))
      .filter((v): v is string => v !== null)
    return emitLines(vals, opts)
  }

  if (flags.html) {
    return emitLines(
      els.map((el) => el.innerHTML),
      opts
    )
  }

  // default: text
  return emitLines(
    els.map((el) => collapse(el.textContent ?? '')),
    opts
  )
}
