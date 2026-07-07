import { parseArgs } from '../lib/args'
import { readSource, fail } from '../lib/io'
import { runQuery, emitQueryResult, queryFlagDefs } from '../lib/query'

export const jsonHelp = `ax json — query JSON with a small path language (a jq subset)

usage:
  ax json <file|url|-> [path] [options]

path:
  .                identity
  .key             object member
  .a.b.c           nested members
  .["weird key"]   quoted member
  .items[]         iterate array (or object values) into a stream
  .items[0]        index
  .items[].name    member of every element

options:
  --shape          compact structural summary (never cat a big file again)
  --where <expr>   filter an array result: price > 100 && name ~ /^foo/i
                   (operators: == != > >= < <= ~ !~ && || ! — no eval)
  --pick <a,b>     project each row to these fields (one field → bare value)
  --freq           frequency table of the (picked) values (uniq -c, sorted)
  --tsv            uniform rows as TSV: header once, then values (token-cheap)
  --keys           list the keys of the result (object) or indices (array)
  --len            print the length/size of the result
  --raw            print scalar results as bare lines (not JSON)
  --limit <n>      cap array results (default 50)
  --budget <t>     cap output to ~t tokens
  --all            no cap

one call answers a question — filter + project + aggregate:
  ax json users.json '.users[]' --where 'active == true && age > 40' --pick country --freq

examples:
  ax json data.json --shape
  ax json data.json '.items[].name' --raw
  ax json data.json '.items[]' --where 'price > 100' --pick name,price --tsv
  cat x.json | ax json - --keys`

export async function json(argv: string[]) {
  const { _, flags } = parseArgs(argv, queryFlagDefs)
  if (flags.help) return console.log(jsonHelp)

  const [src, path] = _
  const input = await readSource(src)
  let root: unknown
  try {
    root = JSON.parse(input)
  } catch (e) {
    // NDJSON / JSON Lines / concatenated JSON: parse per line into an array.
    const lines = input.split('\n').filter((l) => l.trim().length > 0)
    try {
      root = lines.map((l) => JSON.parse(l))
    } catch {
      return fail(`invalid JSON: ${(e as Error).message}`)
    }
  }

  await emitQueryResult(runQuery(root, path), flags)
}
