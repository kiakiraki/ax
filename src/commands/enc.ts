import { parseArgs } from '../lib/args'
import { readSource, fail } from '../lib/io'
import { emitJson } from '../lib/emit'

export const encHelp = `ax enc — encode / decode / hash conversions

usage:
  ax enc <mode> [input] [options]

modes:
  base64            encode (default) / decode with -d
  url               percent-encode / decode with -d
  hex               encode / decode with -d
  jwt               decode a JWT and print {header, payload} (no verification)
  sha256 | sha1 | md5   hash the input (hex digest)

options:
  -d, --decode      decode instead of encode (base64, url, hex)

input is an argument, or - / omitted to read stdin.

examples:
  ax enc base64 'hello'
  ax enc base64 -d 'aGVsbG8='
  ax enc url 'こんにちは'
  ax enc jwt "$TOKEN"
  cat file.bin | ax enc sha256`

const te = new TextEncoder()
const td = new TextDecoder()

function b64decode(s: string): Uint8Array {
  // Accept base64url too.
  const norm = s.replace(/-/g, '+').replace(/_/g, '/')
  try {
    return Uint8Array.from(atob(norm), (c) => c.charCodeAt(0))
  } catch {
    return fail('invalid base64 input')
  }
}

function out(s: string) {
  process.stdout.write(s + '\n')
}

export async function enc(argv: string[]) {
  const { _, flags } = parseArgs(argv, {
    decode: { type: 'boolean', short: 'd' },
    help: { type: 'boolean' },
  })
  if (flags.help || _.length === 0) return console.log(encHelp)

  const [mode, arg] = _
  // Input comes from the second positional, or stdin when omitted / '-'.
  const input = arg !== undefined && arg !== '-' ? arg : (await readSource('-')).replace(/\n$/, '')

  switch (mode) {
    case 'base64':
      return out(
        flags.decode ? td.decode(b64decode(input)) : btoa(String.fromCharCode(...te.encode(input)))
      )
    case 'url':
      try {
        return out(flags.decode ? decodeURIComponent(input) : encodeURIComponent(input))
      } catch {
        return fail('invalid percent-encoding')
      }
    case 'hex': {
      if (flags.decode) {
        if (!/^([0-9a-fA-F]{2})*$/.test(input)) return fail('invalid hex input')
        const bytes = input.match(/../g) ?? []
        return out(td.decode(Uint8Array.from(bytes.map((b) => parseInt(b, 16)))))
      }
      return out([...te.encode(input)].map((b) => b.toString(16).padStart(2, '0')).join(''))
    }
    case 'jwt': {
      const parts = input.split('.')
      if (parts.length < 2) return fail('not a JWT (expected header.payload.signature)')
      try {
        const header = JSON.parse(td.decode(b64decode(parts[0]!)))
        const payload = JSON.parse(td.decode(b64decode(parts[1]!)))
        // Decode the well-known time claims for humans.
        const times: Record<string, string> = {}
        for (const k of ['exp', 'iat', 'nbf']) {
          if (typeof payload[k] === 'number') times[k] = new Date(payload[k] * 1000).toISOString()
        }
        return emitJson({ header, payload, ...(Object.keys(times).length ? { times } : {}) })
      } catch {
        return fail('failed to decode JWT segments as base64url JSON')
      }
    }
    case 'sha256':
    case 'sha1':
    case 'md5': {
      const hasher = new Bun.CryptoHasher(mode)
      hasher.update(input)
      return out(hasher.digest('hex'))
    }
    default:
      return fail(`unknown mode: ${mode}`, 'one of base64, url, hex, jwt, sha256, sha1, md5')
  }
}
