import { parseArgs } from '../lib/args'
import { readSource, fail } from '../lib/io'
import { emitJson } from '../lib/emit'

export const statsHelp = `ax stats — statistics over a stream of numbers

usage:
  ax stats <file|url|->

Reads one number per line (non-numeric lines are skipped) and prints
{count, sum, mean, min, max, p50, p90, p95, p99}.

examples:
  ax text app.log --grep INFO --extract '\\d+(?=ms)' --all | ax stats
  ax json api.json '.items[]' --pick price --raw --all | ax stats`

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  return sorted[Math.max(0, idx)]!
}

export async function stats(argv: string[]) {
  const { _, flags } = parseArgs(argv, { help: { type: 'boolean' } })
  if (flags.help) return console.log(statsHelp)

  const nums = (await readSource(_[0]))
    .split('\n')
    .map((l) => Number(l.trim()))
    .filter((n) => Number.isFinite(n))
  if (nums.length === 0) fail('no numbers in input', 'expected one number per line')

  const sorted = [...nums].sort((a, b) => a - b)
  const sum = nums.reduce((a, b) => a + b, 0)
  const round = (n: number) => Math.round(n * 100) / 100

  emitJson({
    count: nums.length,
    sum: round(sum),
    mean: round(sum / nums.length),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p50: percentile(sorted, 50),
    p90: percentile(sorted, 90),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
  })
}
