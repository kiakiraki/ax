// "before": the kind of throwaway regex script a coding agent writes inline
// when it wants to pull structured rows out of HTML. Representative, not a
// strawman — this is roughly what you get from `python3 <<PY ... re ... PY`.
const html = await Bun.file(process.argv[2] ?? 'bench/sample.html').text()

const rows: { href: string; title: string; cefr: string }[] = []
const liRe = /<li class="lesson">([\s\S]*?)<\/li>/g
let m: RegExpExecArray | null
while ((m = liRe.exec(html)) !== null) {
  const block = m[1]!
  const href = block.match(/<a href="([^"]+)"/)?.[1] ?? ''
  const title = block.match(/<a [^>]*>([^<]+)<\/a>/)?.[1]?.trim() ?? ''
  const cefr = block.match(/<span class="cefr">([^<]+)<\/span>/)?.[1] ?? ''
  rows.push({ href, title, cefr })
}
process.stdout.write(JSON.stringify(rows, null, 2) + '\n')
