// Generate src/og.png (1200x630) from an inline SVG at build time.
// Run: bun og.ts   (gen.ts embeds the result into content.gen.ts)
import { Resvg } from '@resvg/resvg-js'

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#ffffff"/>
  <!-- subtle grid, top-right -->
  <g stroke="#e4e7ec" stroke-width="1.5" opacity="0.55" transform="rotate(8 1100 40)">
    ${Array.from({ length: 16 }, (_, i) => `<line x1="${700 + i * 40}" y1="-80" x2="${700 + i * 40}" y2="420"/>`).join('')}
    ${Array.from({ length: 12 }, (_, i) => `<line x1="660" y1="${-60 + i * 40}" x2="1360" y2="${-60 + i * 40}"/>`).join('')}
  </g>
  <!-- wordmark -->
  <text x="80" y="200" font-family="Helvetica, Arial, sans-serif" font-size="132" font-weight="800" letter-spacing="-6" fill="#0a0a0a">ax</text>
  <rect x="238" y="108" width="26" height="110" rx="8" fill="#ff5c1a"/>
  <!-- headline -->
  <text x="80" y="340" font-family="Helvetica, Arial, sans-serif" font-size="72" font-weight="800" letter-spacing="-2.5" fill="#0a0a0a">The Scriptless</text>
  <text x="80" y="425" font-family="Helvetica, Arial, sans-serif" font-size="72" font-weight="800" letter-spacing="-2.5" fill="#0a0a0a">Multitool for Agents</text>
  <!-- prompt line -->
  <text x="80" y="520" font-family="Menlo, monospace" font-size="26" fill="#98a2b3">$ curl -fsSL https://ax.yusuke.run/install | sh</text>
  <rect x="80" y="552" width="1040" height="2" fill="#e4e7ec"/>
  <text x="80" y="596" font-family="Menlo, monospace" font-size="22" fill="#667085">html · json · yaml · text · enc · time — token-cheap by design</text>
</svg>`

const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()
await Bun.write(new URL('src/og.png', import.meta.url), png)
console.log(`wrote src/og.png (${png.length} bytes)`)
