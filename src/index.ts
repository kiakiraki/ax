#!/usr/bin/env bun
import { html, htmlHelp } from './commands/html'
import { json, jsonHelp } from './commands/json'
import { text, textHelp } from './commands/text'

const VERSION = '0.1.0'

const TOP_HELP = `ax — a scriptless multitool for AI agents (v${VERSION})

Reach for this instead of writing a throwaway python/regex script.
JSON is the lingua franca; output is capped by default to stay token-cheap.

commands:
  html   extract from HTML with CSS selectors
  json   query JSON with a jq-subset path language
  text   line-oriented grep / head / tail / count

run 'ax <command> --help' for details, e.g. ax html --help`

const commands: Record<string, { run: (a: string[]) => unknown; help: string }> = {
  html: { run: html, help: htmlHelp },
  json: { run: json, help: jsonHelp },
  text: { run: text, help: textHelp },
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2)

  if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') {
    console.log(TOP_HELP)
    return
  }
  if (cmd === '--version' || cmd === '-v') {
    console.log(VERSION)
    return
  }

  const entry = commands[cmd]
  if (!entry) {
    process.stderr.write(
      `ax: error: unknown command "${cmd}"\n  hint: one of ${Object.keys(commands).join(', ')}\n`
    )
    process.exit(1)
  }
  await entry.run(rest)
}

main()
