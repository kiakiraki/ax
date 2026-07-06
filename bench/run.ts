// Bench runner: one short allowlisted command instead of a multi-line
// claude -p invocation (which defeats the permission matcher every time).
//
//   bun bench/run.ts <dir> <model> <prompt-file> [--skill]
//
// Runs headless Claude in <dir>, writes bench-result.json + err.log there,
// and prints the metrics summary.
import { join } from 'node:path'

const [dir, model, promptFile, ...rest] = process.argv.slice(2)
if (!dir || !model || !promptFile) {
  console.error('usage: bun bench/run.ts <dir> <model> <prompt-file> [--skill]')
  process.exit(1)
}

const skillPath = new URL('../skills/ax/SKILL.md', import.meta.url).pathname
let prompt = await Bun.file(promptFile).text()
if (rest.includes('--skill')) {
  const body = (await Bun.file(skillPath).text()).split('\n').slice(6).join('\n')
  prompt = `${body}\n\n${prompt}`
}

const proc = Bun.spawn(
  [
    'claude',
    '-p',
    prompt,
    '--model',
    model,
    '--output-format',
    'json',
    '--allowedTools',
    'Bash,Read,Grep,Glob',
    '--max-turns',
    '40',
  ],
  { cwd: dir, stdout: 'pipe', stderr: 'pipe' }
)
const out = await new Response(proc.stdout).text()
const err = await new Response(proc.stderr).text()
await Bun.write(join(dir, 'bench-result.json'), out)
await Bun.write(join(dir, 'err.log'), err)
await proc.exited

try {
  const r = JSON.parse(out.split('\n')[0]!)
  console.log(
    JSON.stringify(
      {
        model,
        dir,
        cost_usd: r.total_cost_usd,
        duration_s: Math.round(r.duration_ms / 100) / 10,
        turns: r.num_turns,
        output_tokens: r.usage?.output_tokens,
      },
      null,
      2
    )
  )
} catch {
  console.error('run finished but result JSON could not be parsed — see err.log')
  process.exit(1)
}
