import { test, expect } from 'bun:test'
import { homedir } from 'node:os'
import { join } from 'node:path'

// --like needs the cached model (~/.cache/ax). Skip where it isn't present
// (CI) — the engine itself is deterministic, so local runs are meaningful.
const cached = await Bun.file(join(homedir(), '.cache', 'ax', 'minilm-q8.onnx')).exists()
const ENTRY = join(import.meta.dir, '..', 'src', 'index.ts')

test.skipIf(!cached)('text --like: ranks by meaning, not keywords', () => {
  const input = [
    'the delivery never arrived and the courier was rude',
    'great battery life on this laptop',
    'package came two weeks late, box crushed',
    'love the new dashboard design',
  ].join('\n')
  const proc = Bun.spawnSync(
    ['bun', ENTRY, 'text', '-', '--like', 'shipping complaints', '--limit', '2'],
    {
      stdin: new TextEncoder().encode(input),
    }
  )
  const lines = proc.stdout.toString().trim().split('\n')
  expect(lines).toHaveLength(2)
  // Both top hits must be the shipping lines; scores prefixed.
  expect(lines[0]).toMatch(/^0\.\d+ {2}/)
  expect(lines.join(' ')).toContain('courier')
  expect(lines.join(' ')).toContain('package')
  expect(lines.join(' ')).not.toContain('battery')
})

test.skipIf(!cached)('text --like: deterministic across runs', () => {
  const run = () =>
    Bun.spawnSync(['bun', ENTRY, 'text', '-', '--like', 'database problems', '--limit', '3'], {
      stdin: new TextEncoder().encode(
        'db connection refused\nsunny weather today\nquery timeout on orders table\n'
      ),
    }).stdout.toString()
  expect(run()).toBe(run())
})
