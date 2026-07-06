// Read a source that is a URL, a file path, or "-" (stdin).
export async function readSource(src: string | undefined): Promise<string> {
  if (src === undefined || src === '-') {
    return await Bun.stdin.text()
  }
  if (/^https?:\/\//.test(src)) {
    const res = await fetch(src)
    if (!res.ok) fail(`fetch failed: ${res.status} ${res.statusText} for ${src}`)
    return await res.text()
  }
  const file = Bun.file(src)
  if (!(await file.exists())) fail(`no such file: ${src}`)
  return await file.text()
}

// Structured, single-line error to stderr, then exit. Keeps agent retries cheap.
export function fail(msg: string, hint?: string): never {
  process.stderr.write(`ax: error: ${msg}${hint ? `\n  hint: ${hint}` : ''}\n`)
  process.exit(1)
}
