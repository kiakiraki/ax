// Fixture for the semantic-search bench: 2000 support messages, one per line.
// 40 shipping complaints with deliberately varied vocabulary (no shared
// keyword), plus positive-shipping decoys that break keyword grepping.
// Ground truth is constructed, and written to shipping-truth.json (kept OUT
// of the bench dirs).

const complaints = [
  'my parcel has been stuck in transit for nine days now',
  'the box showed up completely crushed on one side',
  'courier tossed the package over my gate and broke it',
  'tracking says delivered but there is nothing at my door',
  'item never arrived and support keeps ignoring me',
  'driver left my order out in the rain, everything soaked',
  'second time my delivery goes to the wrong address',
  'waited home all day and nobody showed up with my order',
  'the carton arrived open with two items missing',
  'shipment got returned to sender without any explanation',
]
const positiveShipping = [
  'shipping was incredibly fast, ordered monday got it tuesday',
  'the delivery driver was so friendly, five stars',
  'package arrived a day early and perfectly wrapped, thanks',
  'tracking updates were accurate the whole way, great job',
]
const filler = [
  'how do i change the billing address on my account',
  'the app crashes when i open settings on my phone',
  'please add dark mode to the dashboard',
  'i love the new editor, huge improvement',
  'can i export my data as csv somewhere',
  'password reset email never lands in my inbox',
  'the api rate limits feel too strict for the pro plan',
  'video playback stutters on slower connections',
  'would be great to have keyboard shortcuts for search',
  'invoice pdf shows the wrong company name',
  'two factor auth keeps logging me out daily',
  'the mobile layout overlaps on small screens',
]

const lines: string[] = []
const truthLines: number[] = []
let c = 0
let p = 0
for (let i = 1; i <= 2000; i++) {
  if (i % 50 === 0 && c < 40) {
    // a complaint every 50 lines, varied wording + a unique ticket id
    lines.push(`[T${10000 + i}] ${complaints[c % complaints.length]} (order ${7000 + i})`)
    truthLines.push(i)
    c++
  } else if (i % 97 === 0 && p < 20) {
    lines.push(`[T${10000 + i}] ${positiveShipping[p % positiveShipping.length]}`)
    p++
  } else {
    lines.push(`[T${10000 + i}] ${filler[i % filler.length]} (ref ${i * 3})`)
  }
}

await Bun.write('bench/tickets.txt', lines.join('\n') + '\n')
await Bun.write(
  'bench/shipping-truth.json',
  JSON.stringify({ complaintCount: c, positiveDecoys: p, truthLines }, null, 2)
)
console.log(`wrote bench/tickets.txt (${lines.length} lines, ${c} complaints, ${p} decoys)`)
