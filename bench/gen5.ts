// Semantic haystack v3: 5000 textually-unique support lines with NO
// statistical shortcuts — no repeated templates (combinatorial fillers +
// LLM-generated ones), no id/suffix tells, seeded shuffle. The only ways to
// find the 40 shipping complaints are (a) read everything, or (b) search by
// meaning. That asymmetry is the point of the bench.

// Seeded PRNG so the fixture (and truth) are reproducible.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260707)
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)]!

// --- 40 unique shipping complaints (several without shipping keywords) ---
const complaints = [
  'my parcel has been stuck in transit for nine days now',
  'the box showed up completely crushed on one side',
  'courier tossed the package over my gate and broke the contents',
  'tracking says delivered but there is nothing at my door',
  'the item never arrived and support keeps ignoring my emails',
  'driver left my order out in the rain and everything soaked through',
  'second time in a row my stuff goes to somebody elses address',
  'waited home all day and nobody showed up with my order',
  'the carton arrived open with two items missing inside',
  'my shipment got returned to sender without any explanation',
  'ordered express and it still took two whole weeks to show up',
  'the fragile sticker was ignored and the vase is in pieces',
  'the freight company apparently lost my entire order',
  'my box was left at a neighbors place three blocks away',
  'paid extra for saturday arrival and it came wednesday after',
  'the parcel smells like it was stored next to gasoline',
  'half my books came bent because the envelope was too thin',
  'the pallet arrived with tire marks across the top carton',
  'my replacement unit is now later than the original was',
  'customs held it a month because the label was filled out wrong',
  'the delivery guy demanded a tip before handing over my box',
  'the crate was dropped on my porch hard enough to crack it',
  'i received someone elses medication instead of my order',
  'the van drove off while i was literally waving at it',
  'my address was typed correctly yet it bounced back twice',
  'a signature was forged, i never received or signed anything',
  'the cold-chain box arrived warm and the contents spoiled',
  'they crammed a guitar sized box into my tiny mailbox slot',
  'the promised two day arrival has become a three week saga',
  'the outer wrap was retaped and items were clearly tampered with',
  'my order sat at the depot for ten days marked out for handoff',
  'the courier marked it refused while i was home the entire time',
  'both attempts happened while the app said no attempts were made',
  'the box of glassware rattled like a maraca when it arrived',
  'i got an empty envelope with literally nothing inside it',
  'the heavy appliance was left blocking my garage door',
  'rain destroyed the electronics because nothing was wrapped in plastic',
  'the label printed my apartment number wrong despite correct input',
  'this is the third damaged arrival this quarter from this carrier',
  'my package toured four states before dying in a warehouse',
]
const shippingDecoys = [
  'shipping was incredibly fast, ordered monday got it tuesday',
  'the delivery driver was so friendly, five stars from me',
  'my package arrived a day early and perfectly wrapped, thanks',
  'tracking updates were accurate the whole way through, great job',
  'how much does express arrival cost to okinawa',
  'do you ship internationally to canada yet',
  'can i change the drop-off address after placing an order',
  'what carrier do you use for oversized freight items',
  'the courier waited while i found my keys, super kind of him',
  'how do i schedule a redelivery for next tuesday morning',
]

// --- combinatorial fillers: every line unique, no shipping vocabulary ---
const subjects = [
  'the dashboard',
  'my account page',
  'the ios app',
  'the android build',
  'the billing portal',
  'the export wizard',
  'dark mode',
  'the search bar',
  'the onboarding flow',
  'my profile photo',
  'the notification center',
  'the api console',
  'the admin panel',
  'the editor',
  'the calendar view',
  'the sync engine',
  'the login screen',
  'two factor auth',
  'the report generator',
  'the audio player',
  'the video call widget',
  'my subscription',
  'the invoice history',
  'the team settings',
  'the webhook config',
  'autosave',
  'the keyboard shortcuts',
  'the color picker',
  'the trash folder',
  'the archive view',
]
const behaviors = [
  'freezes for a few seconds',
  'logs me out randomly',
  'shows a blank screen',
  'renders overlapping text',
  'ignores my saved settings',
  'duplicates every entry',
  'takes forever to load',
  'throws error code %E',
  'drains my battery fast',
  'resets to defaults',
  'flickers in dark rooms',
  'crashes on startup',
  'misaligns on wide monitors',
  'loses my unsaved edits',
  'plays sounds twice',
  'skips every other item',
  'refuses to open pdfs',
  'caps out at ten entries',
  'hides the save button',
  'garbles japanese characters',
]
const contexts = [
  'since the latest update',
  'after i switched plans',
  'when my laptop wakes from sleep',
  'on slow wifi',
  'during peak hours',
  'whenever i use a vpn',
  'right after login',
  'in the middle of a demo',
  'on my old ipad',
  'since yesterday morning',
  'every monday somehow',
  'when two tabs are open',
  'after clearing my cache',
  'in the embedded view',
  'while screen sharing',
  'on the free tier',
]
const tones = [
  'please look into it',
  'is there a workaround',
  'this is blocking my team',
  'not urgent but annoying',
  'happy to send logs',
  'my coworker sees it too',
  'started this week',
  'refund if unfixable please',
  'love the product otherwise',
  'consider this a bug report',
  'any eta on a fix',
  'downgrading until resolved',
]

function combiFiller(i: number): string {
  const line = `${pick(subjects)} ${pick(behaviors)} ${pick(contexts)}, ${pick(tones)}`
  return line.replace('%E', String(400 + (i % 180)))
}

// --- LLM-generated fillers (unique, varied) passed in as JSON files ---
const llm: string[] = []
for (const f of process.argv.slice(2)) {
  // Files are claude CLI JSON results; the array lives in .result (possibly fenced).
  const cli = JSON.parse((await Bun.file(f).text()).split('\n')[0]!) as { result: string }
  const m = cli.result.match(/\[[\s\S]*\]/)
  if (m) llm.push(...(JSON.parse(m[0]) as string[]))
}
const llmClean = [...new Set(llm)].filter(
  (l) => !/ship|deliver|courier|package|parcel|mail|freight/i.test(l)
)

const TOTAL = 5000
const lines: string[] = []
lines.push(...complaints)
lines.push(...shippingDecoys)
lines.push(...llmClean)
const seen = new Set(lines)
let i = 0
while (lines.length < TOTAL) {
  const f = combiFiller(i++)
  if (!seen.has(f)) {
    seen.add(f)
    lines.push(f)
  }
}

// Seeded shuffle, then assign sequential ids AFTER shuffling (no id tells).
for (let k = lines.length - 1; k > 0; k--) {
  const j = Math.floor(rand() * (k + 1))
  ;[lines[k], lines[j]] = [lines[j]!, lines[k]!]
}
const out = lines.map((l, idx) => `[T${20000 + idx}] ${l}`)
const truthIds = out.filter((l) => complaints.some((c) => l.includes(c))).map((l) => l.slice(1, 7))

await Bun.write('bench/tickets5k.txt', out.join('\n') + '\n')
await Bun.write(
  'bench/tickets5k-truth.json',
  JSON.stringify({ count: truthIds.length, truthIds }, null, 2)
)
console.log(
  `wrote bench/tickets5k.txt (${out.length} lines, ${truthIds.length} complaints, ${llmClean.length} llm fillers)`
)
