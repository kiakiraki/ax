import { Hono } from 'hono'
import { duelBefore, installSh, llmsTxt, skillMd } from './content.gen'

const app = new Hono()

app.get('/install', (c) => c.text(installSh))
app.get('/llms.txt', (c) => c.text(llmsTxt))
app.get('/skill.md', (c) => c.text(skillMd))

const css = `
:root{--paper:#f6f3ec;--card:#fffdf8;--ink:#1a1712;--soft:#6d6656;--rule:#ddd6c6;
--acc:#c2410c;--acc-ink:#fff7ed;--mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--mono);line-height:1.6}
a{color:inherit;text-decoration:none}
::selection{background:#fed7aa;color:#7c2d12}
.top{display:flex;align-items:center;justify-content:space-between;max-width:960px;
margin:0 auto;padding:22px 36px;border-bottom:1.5px solid var(--ink)}
.logo{font-size:18px;font-weight:700;letter-spacing:-.02em}
.logo b{color:var(--acc)}
.top nav{display:flex;gap:22px;font-size:13.5px}
.top nav a:hover{color:var(--acc)}
.intro{max-width:960px;margin:0 auto;padding:76px 36px 56px}
h1{font-size:clamp(34px,7vw,68px);line-height:1.02;letter-spacing:-.04em;font-weight:700;margin:0 0 24px}
.mark{background:var(--acc);color:var(--acc-ink);padding:0 .14em;border-radius:4px;display:inline-block}
.strike{text-decoration:line-through;text-decoration-thickness:3px;text-decoration-color:var(--acc);color:var(--soft)}
.sub{font-size:16px;max-width:560px;color:#3d372b;margin:0 0 30px}
.cta{display:flex;gap:12px;flex-wrap:wrap}
.copy,.ghost{display:inline-flex;align-items:center;gap:9px;border:1.5px solid var(--ink);
border-radius:8px;padding:11px 16px;font-size:14px;font-family:var(--mono);cursor:pointer;
box-shadow:3px 3px 0 var(--ink);transition:.12s}
.copy{background:var(--card);color:var(--ink)}
.ghost{background:var(--acc);color:var(--acc-ink);font-weight:600}
.copy:hover,.ghost:hover{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--ink)}
.copy .prompt{color:var(--acc)}
section{max-width:960px;margin:0 auto;padding:0 36px 96px}
h2{font-size:clamp(22px,3.4vw,32px);letter-spacing:-.03em;margin:0 0 28px;font-weight:700}
.duel{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1.5px solid var(--ink);
border-radius:10px;overflow:hidden;box-shadow:6px 6px 0 var(--ink)}
.duel .pane{padding:20px 22px;background:var(--card);min-width:0}
.duel .pane.bad{border-right:1.5px solid var(--ink);background:#efe9dc}
.duel .tag{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--soft);margin-bottom:12px}
.duel .tag b{color:var(--acc)}
.duel pre{margin:0;font-size:12.5px;line-height:1.55;overflow-x:auto;white-space:pre}
.duel .bad pre{color:#6d6656}
.grid{display:grid;grid-template-columns:repeat(3,1fr);border-top:1.5px solid var(--ink);border-left:1.5px solid var(--ink)}
.grid article{border-right:1.5px solid var(--ink);border-bottom:1.5px solid var(--ink);
padding:22px 20px;background:var(--card)}
.grid article:hover{background:#fff}
.num{font-size:11.5px;color:var(--soft);letter-spacing:.1em}
.grid h3{font-size:15.5px;margin:9px 0 7px}
.grid p{margin:0 0 12px;font-size:13px;color:#3d372b}
.grid pre{margin:0;font-size:11.5px;overflow-x:auto;color:var(--ink);background:#f1ece0;
border:1px solid var(--rule);border-radius:6px;padding:10px 12px}
.install ul{list-style:none;margin:0 0 18px;padding:0;border-top:1.5px solid var(--ink)}
.install li{display:flex;align-items:center;gap:20px;padding:15px 4px;border-bottom:1.5px solid var(--rule)}
.install .t{width:110px;flex-shrink:0;font-size:12px;color:var(--soft);letter-spacing:.08em;text-transform:uppercase}
.install code{font-size:14px;overflow-x:auto;white-space:nowrap}
.install code::before{content:'$ ';color:var(--acc)}
.agents p{max-width:640px;font-size:14px;color:#3d372b}
.agents .files{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}
.files a{display:inline-flex;gap:8px;border:1.5px solid var(--ink);border-radius:8px;padding:9px 14px;
font-size:13px;background:var(--card);box-shadow:3px 3px 0 var(--ink);transition:.12s}
.files a:hover{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--ink)}
.files a span{color:var(--acc)}
.bottom{max-width:960px;margin:0 auto;padding:26px 36px 52px;display:flex;align-items:center;
justify-content:space-between;gap:20px;flex-wrap:wrap;font-size:12.5px;border-top:1.5px solid var(--ink)}
.bottom .links{display:flex;gap:18px}
.bottom a:hover{color:var(--acc)}
@media(max-width:760px){
.duel{grid-template-columns:1fr}
.duel .pane.bad{border-right:none;border-bottom:1.5px solid var(--ink)}
.grid{grid-template-columns:1fr}
.top,.intro,section,.bottom{padding-left:20px;padding-right:20px}
}`

const copyJs = `
document.querySelectorAll('.copy').forEach(function(btn){
  btn.addEventListener('click',function(){
    navigator.clipboard.writeText(btn.dataset.cmd).then(function(){
      var t=btn.querySelector('.cmd').textContent
      btn.querySelector('.cmd').textContent='copied!'
      setTimeout(function(){btn.querySelector('.cmd').textContent=t},1200)
    })
  })
})`

const INSTALL_CMD = 'curl -fsSL https://ax.yusuke.run/install | sh'

const Page = () => (
  <html lang='en'>
    <head>
      <meta charset='utf-8' />
      <meta name='viewport' content='width=device-width, initial-scale=1' />
      <title>ax — a scriptless multitool for AI agents</title>
      <meta
        name='description'
        content='One binary. No more throwaway scripts. Extract HTML, query JSON, process text — token-cheap by design.'
      />
      <link
        rel='icon'
        href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🪓</text></svg>"
      />
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </head>
    <body>
      <header class='top'>
        <div class='logo'>
          <b>ax</b>
        </div>
        <nav>
          <a href='https://github.com/yusukebe/ax'>GitHub</a>
          <a href='/llms.txt'>llms.txt</a>
          <a href='/skill.md'>skill</a>
        </nav>
      </header>

      <div class='intro'>
        <h1>
          One binary.
          <br />
          No more <span class='strike'>throwaway scripts</span>.<br />
          Just <span class='mark'>ax</span>.
        </h1>
        <p class='sub'>
          A scriptless multitool for AI agents. Extract from HTML, query JSON, process text — in one
          line instead of a python heredoc. Token-cheap output, structured errors, capped by
          default.
        </p>
        <div class='cta'>
          <button class='copy' data-cmd={INSTALL_CMD}>
            <span class='prompt'>$</span>
            <span class='cmd'>{INSTALL_CMD}</span>
          </button>
          <a class='ghost' href='https://github.com/yusukebe/ax'>
            Star on GitHub
          </a>
        </div>
      </div>

      <section>
        <h2>Agents keep writing this.</h2>
        <div class='duel'>
          <div class='pane bad'>
            <div class='tag'>before — 3m19s, 8.6k tokens, breaks on markup shift</div>
            <pre>{duelBefore}</pre>
          </div>
          <div class='pane'>
            <div class='tag'>
              after — <b>one line, structured, unbreakable</b>
            </div>
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
        <h2>Three commands. JSON is the lingua franca.</h2>
        <div class='grid'>
          <article>
            <div class='num'>01</div>
            <h3>ax html</h3>
            <p>CSS selectors, structured rows, and discovery for unknown pages. No regex.</p>
            <pre>{`ax html url '.card' --row \\
  'title=a, href=a@href'
ax html url --outline
ax html url --locate 'text'`}</pre>
          </article>
          <article>
            <div class='num'>02</div>
            <h3>ax json</h3>
            <p>A jq-subset path language for the 95% case.</p>
            <pre>{`ax json api.json \\
  '.items[].name' --raw
ax json api.json --keys`}</pre>
          </article>
          <article>
            <div class='num'>03</div>
            <h3>ax text</h3>
            <p>grep, extract, frequency tables — the shell idioms, built in.</p>
            <pre>{`ax text app.log \\
  --grep 'ERROR' --count
ax text style.css --extract \\
  '#[0-9a-f]{6}' --freq`}</pre>
          </article>
        </div>
      </section>

      <section class='agents'>
        <h2>Built for agents, not just humans.</h2>
        <p>
          Output is capped by default (never silently). Errors are one structured line with a hint.
          <code> --help</code> costs a few dozen tokens. And your agent can learn the whole tool
          from two fetchable files:
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

      <footer class='bottom'>
        <div>
          © {new Date().getFullYear()} Yusuke Wada — MIT — built with Bun, served by Hono on
          Cloudflare Workers
        </div>
        <div class='links'>
          <a href='https://herdr.dev'>Herdr</a>
          <a href='https://www.hunk.dev'>Hunk</a>
        </div>
      </footer>

      <script dangerouslySetInnerHTML={{ __html: copyJs }} />
    </body>
  </html>
)

app.get('/', (c) => c.html(<Page />))

export default app
