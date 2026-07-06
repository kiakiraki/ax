---
name: ax
description: Use the ax CLI instead of writing throwaway python/regex scripts when extracting data from HTML, querying JSON, or processing text from files, URLs, or stdin. Trigger whenever you are about to write an inline script (python3 heredoc, node -e, complex sed/awk) for one-off data extraction, scraping, or exploration of an unknown page.
---

# ax — a scriptless multitool for AI agents

`ax` replaces the throwaway script you were about to write. It reads from a
file, a URL, or `-` (stdin), and speaks JSON.

## When to reach for ax

- You want data out of HTML (a page, a fragment, a saved file) → `ax html`
- You want to query or reshape JSON → `ax json`
- You want grep/head/tail/count/extract over text → `ax text`
- You do NOT know the page structure yet → `ax html --outline / --locate`

Do not write a python heredoc or `node -e` script for these. One `ax` line is
cheaper to write, cheaper to read back, and does not break on markup shifts.

## Workflow: discover, then extract

1. `ax html <url> --outline` — see the repeating tag.class signatures
2. `ax html <url> --locate 'known text'` — learn which selector holds a landmark
3. `ax html <url> '<row-selector>' --count` — confirm your hypothesis
4. `ax html <url> '<row-selector>' --row 'name=sel, href=a@href, ...'` — extract
   structured rows in one shot

## Command cheatsheet

```sh
ax html page.html '.item a' --attr href          # attribute per match
ax html page.html '.item' --text                 # text per match
ax html page.html '.item' --row 'title=a, href=a@href, id=@data-id'
ax html page.html --outline                      # repeating structures
ax html page.html --locate 'some text'           # where does this live?
ax json data.json '.items[].name' --raw          # jq-subset paths
ax json data.json --keys                         # top-level keys
ax text app.log --grep 'ERROR|WARN' --count
ax text style.css --extract '#[0-9a-fA-F]{6}' --freq   # grep -o + uniq -c
```

Full reference: `ax --help`, `ax <command> --help`, or fetch
https://ax.yusuke.run/llms.txt

## Etiquette (matters for token efficiency)

- **One probe per shell call.** Don't batch probes with `echo "==="` banners —
  the tool call itself labels the output.
- **Respect the default cap.** Output is capped at 50 items; a stderr note
  tells you what was hidden. Only add `--all` when you truly need everything.
- **Read stderr.** Errors are one structured line (`ax: error: ...`) with a
  hint — don't retry blind.
- **Pipe, don't script.** `ax html ... --text --all | ax text - --grep ...`
  composes; an inline script does not.
