# ax

**A scriptless multitool for AI agents.** Reach for `ax` instead of writing a throwaway `python3 <<'PY' ... re ... PY` script every time an agent needs to pull data out of HTML, JSON, or text.

```
ax html https://news.ycombinator.com '.titleline > a' --text
ax html page.html '.lesson' --row 'title=a, href=a@href, level=.cefr'
ax json api.json '.data.users[]' --where 'active == true' --raw
ax yaml docker-compose.yml '.services[].image' --raw
ax text app.log --grep 'ERROR|WARN' --count
ax enc jwt "$TOKEN"
ax time 1783332078
```

## Why

Coding agents constantly reach for a one-off Python/regex script to scrape a page or reshape some JSON. That habit is a tax:

- **Tokens** — the agent has to _author_ the whole script every time.
- **Reliability** — regex-on-HTML breaks the moment the markup shifts, and each failure round-trips a stack trace back into the context.
- **Noise** — scripts tend to dump everything, flooding the context window.

`ax` replaces that with one line. It doesn't reinvent `jq` or an HTML parser — it wraps battle-tested libraries and adds an **agent-native layer** on top:

- **Output is capped by default** (and never silently — it tells you what it hid).
- **Errors are one structured line**, not a stack trace.
- **`--help` is dirt cheap** so an agent can discover usage in a few tokens.
- **JSON is the lingua franca**, so subcommands compose through pipes.
- **Ships as a single binary** — no runtime, no deps to install.

## Install

Requires [Bun](https://bun.sh).

```sh
bun install -g @yusukebe/ax   # or: npm install -g @yusukebe/ax
ax --help
```

Or build a standalone single-file binary from source:

```sh
bun install
bun run build        # produces ./ax (single binary via `bun build --compile`)
cp ax ~/.local/bin/  # or anywhere on your PATH
```

## Commands

### `ax html` — extract from HTML with CSS selectors

No regex, no broken markup (powered by `linkedom`, standard DOM under the hood).

```sh
ax html page.html '.lesson a' --attr href      # an attribute, one per line
ax html https://example.com 'h2' --text        # text content
ax html page.html '.card' --json               # {text, html, attrs} per match
```

**`--row` — structured rows in one call.** The thing agents usually write Python for: pull several fields out of each repeating element at once.

```sh
ax html page.html '.lesson' --row 'title=a, href=a@href, level=.cefr, id=a@data-id'
```

```json
[
  { "title": "Small talk", "href": "/lesson/1.htm", "level": "A2", "id": "1" },
  { "title": "Ordering food", "href": "/lesson/2.htm", "level": "B1", "id": "2" }
]
```

Each field is `name=selector`. The selector is relative to the matched element; `@attr` reads an attribute; an empty selector (e.g. `id=@data-id`) targets the match itself.

**Discovery — explore an unknown page without dumping raw HTML.** This replaces the other reason agents reach for a script: spelunking the markup to figure out its structure.

```sh
ax html https://site.com/ --outline            # repeating tag.class + counts
ax html https://site.com/ --locate 'BurgerBarn' # which selector holds this text?
ax html page.html '.card' --count              # how many match a hypothesis
```

`--locate` answers with a **selector path**, not 600 bytes of raw HTML:

```json
[
  {
    "selector": "div.group5 > div.floatleft > a",
    "match": "href=\"1449-Todd-BurgerBarn.htm\""
  }
]
```

The agent reads that and jumps straight to `--row` — no raw bytes ever hit the context window.

### `ax json` — query JSON with a jq-subset path language

```sh
ax json data.json '.items[].name' --raw        # stream of values as lines
ax json api.json '.data.users[0]'              # index / nested access
cat x.json | ax json - --keys                  # list keys
ax json data.json '.items' --len               # length
```

Supported path: `.`, `.key`, `.a.b.c`, `.arr[]` (iterate), `.arr[0]` (index), `.arr[].key`.

### `ax text` — line-oriented grep / head / tail / count

```sh
ax text app.log --grep 'ERROR|WARN' --count
ax text README.md --head 20
cat data.txt | ax text - --grep '^\d+' -i
```

## Conventions shared by every command

- **Source** is a file path, a URL (`http(s)://`), or `-` for stdin.
- **`--limit <n>`** caps results (default 50); **`--all`** removes the cap.
- Results over the cap print a `note:` on stderr — capping is never silent.
- Errors go to stderr as a single `ax: error: ...` line and exit non-zero.

## Built with

[Bun](https://bun.sh) — `Bun.file` / `Bun.stdin` for I/O, built-in `fetch` for URLs, `util.parseArgs` for flags, and `bun build --compile` for the single-file binary. HTML parsing uses `linkedom` (standard DOM API). Formatted with `oxfmt`.
