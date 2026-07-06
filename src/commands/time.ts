import { parseArgs } from '../lib/args'
import { fail } from '../lib/io'
import { emitJson } from '../lib/emit'

export const timeHelp = `ax time — convert between epoch, ISO, and human time

usage:
  ax time [input] [options]

input:
  (omitted) | now   current time
  1783332078        epoch seconds
  1783332078015     epoch milliseconds
  2026-07-06T10:01:18Z   ISO 8601 / anything Date.parse accepts

options:
  --tz <zone>       extra timezone to include (e.g. --tz Asia/Tokyo)

examples:
  ax time
  ax time 1783332078
  ax time '2026-07-06 19:00' --tz America/Los_Angeles`

function parseInput(input: string | undefined): Date {
  if (input === undefined || input === 'now') return new Date()
  if (/^\d{13}$/.test(input)) return new Date(Number(input))
  if (/^\d{9,11}$/.test(input)) return new Date(Number(input) * 1000)
  const d = new Date(input)
  if (Number.isNaN(d.getTime()))
    fail(`cannot parse time: ${input}`, 'use epoch, ISO 8601, or "now"')
  return d
}

function relative(d: Date): string {
  const diff = d.getTime() - Date.now()
  const abs = Math.abs(diff)
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [31536000000, 'year'],
    [2592000000, 'month'],
    [86400000, 'day'],
    [3600000, 'hour'],
    [60000, 'minute'],
    [1000, 'second'],
  ]
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [ms, unit] of units) {
    if (abs >= ms || unit === 'second') return rtf.format(Math.round(diff / ms), unit)
  }
  return 'now'
}

function inZone(d: Date, tz: string): string {
  try {
    return d.toLocaleString('sv-SE', { timeZone: tz, timeZoneName: 'short' })
  } catch {
    return fail(`unknown timezone: ${tz}`, 'IANA name like Asia/Tokyo, America/New_York')
  }
}

export async function time(argv: string[]) {
  const { _, flags } = parseArgs(argv, {
    tz: { type: 'string' },
    help: { type: 'boolean' },
  })
  if (flags.help) return console.log(timeHelp)

  const d = parseInput(_[0])
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone

  const result: Record<string, string | number> = {
    epoch: Math.floor(d.getTime() / 1000),
    epoch_ms: d.getTime(),
    iso: d.toISOString(),
    local: `${inZone(d, localTz)} (${localTz})`,
    relative: relative(d),
  }
  if (typeof flags.tz === 'string') result[flags.tz] = inZone(d, flags.tz)

  emitJson(result)
}
