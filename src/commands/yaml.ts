import { loadAll } from 'js-yaml'
import { parseArgs } from '../lib/args'
import { readSource, fail } from '../lib/io'
import { runQuery, emitQueryResult, queryFlagDefs } from '../lib/query'

export const yamlHelp = `ax yaml — query YAML with the same path language as ax json

usage:
  ax yaml <file|url|-> [path] [options]

Multi-document YAML becomes an array of documents.

path & options: identical to ax json (see: ax json --help)

examples:
  ax yaml docker-compose.yml '.services[].image' --raw
  ax yaml .github/workflows/ci.yml '.jobs' --keys
  cat k8s.yml | ax yaml - '.spec.containers[0].image'`

export async function yaml(argv: string[]) {
  const { _, flags } = parseArgs(argv, queryFlagDefs)
  if (flags.help) return console.log(yamlHelp)

  const [src, path] = _
  let docs: unknown[]
  try {
    docs = loadAll(await readSource(src))
  } catch (e) {
    return fail(`invalid YAML: ${(e as Error).message}`)
  }

  const root: unknown = docs.length === 1 ? docs[0] : docs
  emitQueryResult(runQuery(root, path), flags)
}
