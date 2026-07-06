---
name: ax
description: Use the ax CLI instead of writing throwaway python/regex scripts when extracting data from HTML, querying JSON/YAML, processing text, decoding base64/JWT, or converting timestamps. Trigger whenever you are about to write an inline script (python3 heredoc, node -e, complex sed/awk) for one-off data extraction, scraping, or exploration of an unknown page.
---

# ax — a scriptless multitool for AI agents

`ax` replaces the throwaway script you were about to write. It reads from a
file, a URL, or `-` (stdin), and speaks JSON.

## When to reach for ax

- You want data out of HTML (a page, a fragment, a saved file) → `ax html`
- You want to query or reshape JSON → `ax json`
- You want to read YAML (CI configs, compose, k8s) → `ax yaml`
- You want grep/head/tail/count/extract over text → `ax text`
- You want base64/url/hex/JWT decode or a hash → `ax enc`
- You want epoch ⇔ ISO ⇔ timezone conversion → `ax time`
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
ax json api.json --shape                         # structure in one line — never cat a big file
ax json api.json '.users[]' --where 'active == true && age > 40' --pick country --freq
ax json data.json '.items[]' --pick name,price --tsv   # token-cheap rows
ax html page.html '.item' --row 'title=a, href=a@href, id=@data-id'
ax html page.html 'table.stats' --table          # <table> → rows JSON
ax html page.html --outline                      # repeating structures
ax html page.html --locate 'some text'           # where does this live?
ax yaml compose.yml '.services[].image' --raw    # same paths for YAML
ax text app.log --grep 'ERROR|WARN' --count
ax text style.css --extract '#[0-9a-fA-F]{6}' --freq   # grep -o + uniq -c
ax enc jwt "$TOKEN"                              # peek header/payload
ax time 1783332078                               # epoch → ISO/local/relative
```

One question → one call: prefer `--where/--pick/--freq` in a single command over
building shell pipelines. When you do pipe ax into ax, add `--all` upstream.

## Speed discipline

Aim for ≤3 tool calls on a multi-part question: one batched look, one batched
query line, then answer. Turns cost more than commands — semicolons are free.
When the question already names the files and fields, merge the look into the
query call (put --shape/--outline first on the same line) and answer on turn 2.
Answer with the numbers, concisely — no methodology narration.

```sh
# call 1 — look at everything at once:
ax text app.log --head 5; ax json users.json --shape
# call 2 — every answer in one line (note the quoting: "field == 'string'"):
ax text app.log --grep ' INFO ' --extract '(\d+)ms' --all | ax stats; \
ax text app.log --grep ' ERROR ' --extract 'E\d+' --freq; \
ax json users.json '.users[]' --where "active == true && plan == 'pro'" --pick age --raw --all | ax stats
# call 3 — answer. Done.
```

ax is deterministic: do not re-verify results that came back consistent.
One cross-check max, and only when numbers disagree. `ax stats` for
percentiles/means, `--freq` for top-N: never hand-compute.

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
