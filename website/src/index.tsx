import { Hono } from 'hono'
import { duelBefore, installSh, llmsTxt, ogPngB64, skillMd } from './content.gen'

const app = new Hono()

app.get('/install', (c) => c.text(installSh))
app.get('/llms.txt', (c) => c.text(llmsTxt))
app.get('/skill.md', (c) => c.text(skillMd))
app.get('/og.png', (c) => {
  const bytes = Uint8Array.from(atob(ogPngB64), (ch) => ch.charCodeAt(0))
  return c.body(bytes, 200, {
    'Content-Type': 'image/png',
    'Cache-Control': 'public, max-age=86400',
  })
})

const css = `
:root{--ink:#0a0a0a;--gray:#667085;--faint:#98a2b3;--line:#e4e7ec;--bg:#ffffff;
--card:#fcfcfd;--accent:#ff5c1a;
--sans:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;
--mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);line-height:1.6}
a{color:inherit;text-decoration:none}
code,pre{font-family:var(--mono)}
.wrap{max-width:1040px;margin:0 auto;padding:0 32px}
.hero-bg{position:relative;overflow:hidden}
.hero-bg::before{content:'';position:absolute;top:-60px;right:-120px;width:560px;height:520px;
background-image:linear-gradient(var(--line) 1px,transparent 1px),
linear-gradient(90deg,var(--line) 1px,transparent 1px);
background-size:36px 36px;transform:rotate(8deg);opacity:.5;
-webkit-mask-image:radial-gradient(closest-side,black,transparent);
mask-image:radial-gradient(closest-side,black,transparent);pointer-events:none}
.top{display:flex;align-items:center;justify-content:space-between;padding:24px 0;position:relative}
.logo{font-size:19px;font-weight:800;letter-spacing:-.02em}
.logo b{color:var(--accent)}
.top nav{display:flex;gap:26px;font-size:14px;color:var(--gray)}
.top nav a:hover{color:var(--ink)}
.hero{padding:84px 0 30px;position:relative}
h1{font-size:clamp(40px,7.4vw,84px);line-height:1.0;letter-spacing:-.045em;font-weight:900;margin:0 0 26px}
.sub{font-size:clamp(17px,2.2vw,22px);color:var(--gray);max-width:640px;margin:0 0 36px;line-height:1.5}
.cta{display:flex;gap:14px;flex-wrap:wrap;align-items:center}
.btn{display:inline-flex;align-items:center;gap:10px;border-radius:999px;padding:14px 26px;
font-size:15px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:.15s;font-family:var(--sans)}
.btn.dark{background:#111;color:#fff}
.btn.dark:hover{background:#000;transform:translateY(-1px)}
.btn.lite{background:#fff;color:var(--ink);border-color:var(--line)}
.btn.lite:hover{border-color:var(--faint)}
.quote{margin:22px 0 0;font-family:var(--mono);font-size:13.5px;color:var(--faint)}
.quote::before{content:'\\201C  '}
.quote::after{content:'  \\201D'}
.show{margin:64px 0 96px;border:1px solid var(--line);border-radius:14px;overflow:hidden;
box-shadow:0 24px 48px -32px rgba(16,24,40,.18);background:#fff;position:relative}
.show .bar{display:flex;border-bottom:1px solid var(--line);background:var(--card);
font-family:var(--mono);font-size:13px;overflow-x:auto}
.show .tab{padding:13px 20px;color:var(--gray);cursor:pointer;white-space:nowrap;border-right:1px solid var(--line)}
.show .tab.on{background:#fff;color:var(--ink)}
.show .tab .sig{color:var(--faint);margin-right:8px}
.show pre{margin:0;padding:24px 26px;font-size:13.5px;line-height:1.7;overflow-x:auto;display:none;background:#fff}
.show pre.on{display:block}
.show .c{color:var(--faint)}
.show .p{color:var(--accent);font-weight:700}
.show .o{color:#1570ef}
section{padding:0 0 96px}
h2{font-size:clamp(26px,3.6vw,38px);letter-spacing:-.035em;font-weight:800;margin:0 0 10px}
.lead{color:var(--gray);font-size:16px;max-width:620px;margin:0 0 34px}
.duel{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.duel .pane{border:1px solid var(--line);border-radius:12px;padding:20px 22px;background:#fff;min-width:0}
.duel .pane.bad{background:var(--card)}
.duel .tag{font-size:12px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;
color:var(--faint);margin-bottom:12px}
.duel .pane:not(.bad) .tag{color:var(--accent)}
.duel pre{margin:0;font-size:12.5px;line-height:1.6;overflow-x:auto;white-space:pre}
.duel .bad pre{color:var(--faint)}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.grid article{border:1px solid var(--line);border-radius:12px;padding:22px;background:#fff;transition:.15s}
.grid article:hover{box-shadow:0 12px 24px -16px rgba(16,24,40,.2)}
.grid h3{font-family:var(--mono);font-size:15.5px;margin:0 0 6px;font-weight:700}
.grid h3 span{color:var(--accent)}
.grid p{margin:0 0 14px;font-size:13.5px;color:var(--gray)}
.grid pre{margin:0;font-size:12px;overflow-x:auto;background:var(--card);
border:1px solid var(--line);border-radius:8px;padding:12px 14px;line-height:1.6}
.files{display:flex;gap:12px;flex-wrap:wrap}
.files a{display:inline-flex;gap:8px;border:1px solid var(--line);border-radius:10px;padding:12px 18px;
font-size:13.5px;font-family:var(--mono);background:#fff;transition:.15s}
.files a:hover{border-color:var(--faint)}
.files a span{color:var(--accent);font-weight:700}
.install ul{list-style:none;margin:0;padding:0;border:1px solid var(--line);border-radius:12px;overflow:hidden}
.install li{display:flex;align-items:center;gap:20px;padding:16px 22px;background:#fff}
.install li+li{border-top:1px solid var(--line)}
.install .t{width:100px;flex-shrink:0;font-size:11.5px;font-weight:700;color:var(--faint);
letter-spacing:.08em;text-transform:uppercase}
.install code{font-size:13.5px;overflow-x:auto;white-space:nowrap}
.install code::before{content:'$ ';color:var(--accent);font-weight:700}
.bottom{border-top:1px solid var(--line);padding:28px 0 48px;font-size:13.5px;color:var(--faint)}
@media(max-width:760px){
.duel{grid-template-columns:1fr}
.grid{grid-template-columns:1fr}
h1{letter-spacing:-.03em}
}`

const js = `
document.querySelectorAll('[data-copy]').forEach(function(btn){
  btn.addEventListener('click',function(){
    navigator.clipboard.writeText(btn.dataset.copy).then(function(){
      var el=btn.querySelector('.label');var t=el.textContent
      el.textContent='Copied!';setTimeout(function(){el.textContent=t},1200)
    })
  })
})
document.querySelectorAll('.show .tab').forEach(function(tab,i){
  tab.addEventListener('click',function(){
    document.querySelectorAll('.show .tab').forEach(function(t){t.classList.remove('on')})
    document.querySelectorAll('.show pre').forEach(function(p){p.classList.remove('on')})
    tab.classList.add('on')
    document.querySelectorAll('.show pre')[i].classList.add('on')
  })
})`

const INSTALL_CMD = 'curl -fsSL https://ax.yusuke.run/install | sh'
const AGENT_PROMPT =
  'Read https://ax.yusuke.run/llms.txt and use the ax CLI instead of writing throwaway python/regex scripts.'

const showHtml = `<span class="c"># discover an unknown page, then extract structured rows</span>
<span class="p">$</span> ax html https://site.com/ <span class="o">--outline</span>
   50  div.lesson
<span class="p">$</span> ax html https://site.com/ '.lesson' <span class="o">--row</span> 'title=a, href=a@href, level=.cefr'
[
  { "title": "Small talk", "href": "/lesson/1.htm", "level": "A2" },
  ...
]
<span class="p">$</span> ax html page.html 'table.stats' <span class="o">--table --where</span> 'Stars >= 30000'`

const showQuery = `<span class="c"># the same jq-subset path language for JSON and YAML</span>
<span class="p">$</span> ax json api.json '.data.users[]' <span class="o">--where</span> 'active == true' <span class="o">--raw</span>
{"name":"yusuke","active":true}
<span class="p">$</span> ax yaml docker-compose.yml '.services[].image' <span class="o">--raw</span>
nginx:1.25
node:22-slim`

const showUtil = `<span class="c"># the small conversions agents write python for, built in</span>
<span class="p">$</span> ax enc jwt "$TOKEN"
{ "header": {...}, "payload": {...}, "times": { "exp": "2026-07-07T10:01:18Z" } }
<span class="p">$</span> ax time 1783332078
{ "iso": "2026-07-06T10:01:18.000Z", "local": "2026-07-06 19:01:18 (Asia/Tokyo)", ... }`

const Page = () => (
  <html lang='en'>
    <head>
      <meta charset='utf-8' />
      <meta name='viewport' content='width=device-width, initial-scale=1' />
      <title>ax — the scriptless multitool for AI agents</title>
      <meta
        name='description'
        content='One binary that replaces the throwaway scripts your agent keeps writing. Extract HTML, query JSON/YAML, process text — token-cheap by design.'
      />
      <meta property='og:type' content='website' />
      <meta property='og:url' content='https://ax.yusuke.run/' />
      <meta property='og:title' content='ax — the scriptless multitool for AI agents' />
      <meta
        property='og:description'
        content='One binary that replaces the throwaway scripts your agent keeps writing. Extract HTML, query JSON/YAML, process text — token-cheap by design.'
      />
      <meta property='og:image' content='https://ax.yusuke.run/og.png' />
      <meta property='og:image:width' content='1200' />
      <meta property='og:image:height' content='630' />
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content='ax — the scriptless multitool for AI agents' />
      <meta
        name='twitter:description'
        content='One binary that replaces the throwaway scripts your agent keeps writing.'
      />
      <meta name='twitter:image' content='https://ax.yusuke.run/og.png' />
      <link
        rel='icon'
        href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🪓</text></svg>"
      />
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </head>
    <body>
      <div class='hero-bg'>
        <div class='wrap'>
          <header class='top'>
            <div class='logo'>
              <b>ax</b>
            </div>
            <nav>
              <a href='https://github.com/yusukebe/ax'>GitHub</a>
              <a href='/llms.txt'>llms.txt</a>
              <a href='/skill.md'>Skill</a>
            </nav>
          </header>

          <div class='hero'>
            <h1>
              The Scriptless
              <br />
              Multitool for Agents
            </h1>
            <p class='sub'>
              One binary that replaces the throwaway python your agent keeps writing. Extract HTML,
              query JSON and YAML, process text, decode and convert — token-cheap by design.
            </p>
            <div class='cta'>
              <button class='btn dark' data-copy={AGENT_PROMPT}>
                <span class='label'>Copy Prompt</span>
              </button>
              <button class='btn lite' data-copy={INSTALL_CMD}>
                <span class='label'>Copy Install Command</span>
              </button>
            </div>
            <p class='quote'>{AGENT_PROMPT}</p>
          </div>

          <div class='show'>
            <div class='bar'>
              <div class='tab on'>
                <span class='sig'>$</span>ax html
              </div>
              <div class='tab'>
                <span class='sig'>$</span>ax json / yaml
              </div>
              <div class='tab'>
                <span class='sig'>$</span>ax enc / time
              </div>
            </div>
            <pre class='on' dangerouslySetInnerHTML={{ __html: showHtml }} />
            <pre dangerouslySetInnerHTML={{ __html: showQuery }} />
            <pre dangerouslySetInnerHTML={{ __html: showUtil }} />
          </div>
        </div>
      </div>

      <div class='wrap'>
        <section>
          <h2>Agents keep writing this.</h2>
          <p class='lead'>
            Every one-off scrape costs tokens to author, breaks when the markup shifts, and floods
            the context with output. ax replaces the whole habit with one line.
          </p>
          <div class='duel'>
            <div class='pane bad'>
              <div class='tag'>before — 3m19s, 8.6k tokens</div>
              <pre>{duelBefore}</pre>
            </div>
            <div class='pane'>
              <div class='tag'>after — one line</div>
              <pre>{`ax html page.html '.lesson' \\
  --row 'title=a, href=a@href, level=.cefr'

[
  { "title": "Small talk",
    "href": "/lesson/1.htm",
    "level": "A2" },
  ...
]`}</pre>
            </div>
          </div>
        </section>

        <section>
          <h2>Six commands. JSON is the lingua franca.</h2>
          <p class='lead'>
            Output is capped by default — never silently. Errors are one structured line with a
            hint. <code>--help</code> costs a few dozen tokens.
          </p>
          <div class='grid'>
            <article>
              <h3>
                <span>ax</span> html
              </h3>
              <p>CSS selectors, structured rows, tables, and discovery for unknown pages.</p>
              <pre>{`ax html url '.card' --row 'title=a'
ax html url 'table' --table
ax html url --outline / --locate`}</pre>
            </article>
            <article>
              <h3>
                <span>ax</span> json
              </h3>
              <p>A jq-subset path language plus --where expressions.</p>
              <pre>{`ax json api.json '.items[].name'
ax json api.json '.users[]' \\
  --where 'age > 20'`}</pre>
            </article>
            <article>
              <h3>
                <span>ax</span> yaml
              </h3>
              <p>Same paths, same flags — for compose, CI, k8s configs.</p>
              <pre>{`ax yaml compose.yml \\
  '.services[].image' --raw`}</pre>
            </article>
            <article>
              <h3>
                <span>ax</span> text
              </h3>
              <p>grep, extract, frequency tables — the shell idioms, built in.</p>
              <pre>{`ax text app.log --grep 'ERROR' --count
ax text a.css --extract '#\\w{6}' --freq`}</pre>
            </article>
            <article>
              <h3>
                <span>ax</span> enc
              </h3>
              <p>base64, url, hex, JWT peek, hashes. No more python -c.</p>
              <pre>{`ax enc jwt "$TOKEN"
ax enc base64 -d 'aGVsbG8='`}</pre>
            </article>
            <article>
              <h3>
                <span>ax</span> time
              </h3>
              <p>epoch ⇔ ISO ⇔ timezones ⇔ relative, in one call.</p>
              <pre>{`ax time 1783332078
ax time now --tz America/New_York`}</pre>
            </article>
          </div>
        </section>

        <section>
          <h2>Built for agents, not just humans.</h2>
          <p class='lead'>
            <code>ax agent-context</code> prints the full playbook offline, and the same document is
            served for any agent to fetch:
          </p>
          <div class='files'>
            <a href='/llms.txt'>
              <span>GET</span> /llms.txt — full reference for any agent
            </a>
            <a href='/skill.md'>
              <span>GET</span> /skill.md — a Claude Code skill, ready to drop in
            </a>
          </div>
        </section>

        <section class='install'>
          <h2>Install</h2>
          <p class='lead'>A single self-contained binary. No runtime required.</p>
          <ul>
            <li>
              <span class='t'>curl</span>
              <code>curl -fsSL https://ax.yusuke.run/install | sh</code>
            </li>
            <li>
              <span class='t'>homebrew</span>
              <code>brew install yusukebe/tap/ax</code>
            </li>
            <li>
              <span class='t'>source</span>
              <code>git clone https://github.com/yusukebe/ax && cd ax && bun run build</code>
            </li>
          </ul>
        </section>

        <footer class='bottom'>© {new Date().getFullYear()} Yusuke Wada — MIT</footer>
      </div>

      <script dangerouslySetInnerHTML={{ __html: js }} />
    </body>
  </html>
)

app.get('/', (c) => c.html(<Page />))

export default app
