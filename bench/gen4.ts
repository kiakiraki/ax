// Semantic-search fixture v2: every complaint is a UNIQUE sentence (real
// tickets don't repeat templates), plus positive-shipping decoys AND neutral
// shipping questions — so a keyword grep returns a big mixed pile while the
// meaning of "shipping complaint" stays crisp.

const complaints = [
  'my parcel has been stuck in transit for nine days now',
  'the box showed up completely crushed on one side',
  'courier tossed the package over my gate and broke the contents',
  'tracking says delivered but there is nothing at my door',
  'item never arrived and support keeps ignoring my emails',
  'driver left my order out in the rain, everything soaked through',
  'second time in a row my stuff goes to the wrong address',
  'waited home all day and nobody showed up with my order',
  'the carton arrived open with two items missing inside',
  'shipment got returned to sender without any explanation',
  'ordered express and it still took two whole weeks',
  'my fragile sticker was ignored, the vase is in pieces',
  'the freight company lost my entire order apparently',
  'package was left at a neighbors place three blocks away',
  'paid extra for saturday arrival, it came wednesday after',
  'the parcel smells like it was stored next to gasoline',
  'half my books came bent because the envelope was too thin',
  'the pallet arrived with tire marks across the top box',
  'my replacement unit is now later than the original one',
  'customs held it a month because the label was filled wrong',
  'delivery guy demanded a tip before handing over my box',
  'the crate was dropped on my porch loud enough to crack it',
  'received someone elses medication instead of my package',
  'the van drove off while i was literally waving at it',
  'my address was correct yet it bounced back twice',
  'signature was forged, i never received or signed anything',
  'the cold-chain package arrived warm and spoiled',
  'they crammed a guitar sized box into my tiny mailbox slot',
  'promised two day arrival has become a three week saga',
  'the outer wrap was retaped, items clearly tampered with',
  'my order sat at the depot for ten days marked out for handoff',
  'the courier marked it refused, i was home the entire time',
  'both attempts happened while the app said no attempts made',
  'the box of glassware rattled like a maraca on arrival',
  'i got an empty envelope, literally nothing inside it',
  'the heavy appliance was left blocking my garage door',
  'rain destroyed the electronics because no plastic wrap was used',
  'the label printed my apartment number wrong despite correct input',
  'third damaged arrival this quarter, im done with this carrier',
  'my package toured four states before dying in a warehouse',
]
const positiveShipping = [
  'shipping was incredibly fast, ordered monday got it tuesday',
  'the delivery driver was so friendly, five stars from me',
  'package arrived a day early and perfectly wrapped, thanks',
  'tracking updates were accurate the whole way through, great job',
  'fastest arrival i have ever had from an online store',
  'the courier waited while i found my keys, super kind',
  'flawless handoff again, this carrier never disappoints me',
  'even the packaging tape looked premium, lovely unboxing',
  'got my order in perfect shape despite the storm, impressive',
  'the freight team called ahead and placed it exactly where asked',
]
const neutralShipping = [
  'how much does express arrival cost to okinawa',
  'do you ship internationally to canada yet',
  'can i change the drop-off address after ordering',
  'what carrier do you use for oversized items',
  'is signature confirmation required for high value orders',
  'how do i schedule a redelivery for next tuesday',
  'where do i enter a delivery instruction note',
  'does the tracking page have an english version',
  'can two orders be combined into one shipment',
  'what happens if i miss the courier twice',
]
const filler = [
  'how do i change the billing plan on my account',
  'the app crashes when i open settings on my phone',
  'please add dark mode to the dashboard already',
  'i love the new editor, huge improvement over the old one',
  'can i export my project data as csv somewhere',
  'password reset email never lands in my inbox',
  'the api rate limits feel too strict for the pro plan',
  'video playback stutters on slower connections',
  'would be great to have keyboard shortcuts for search',
  'invoice pdf shows the wrong company name',
  'two factor auth keeps logging me out every day',
  'the mobile layout overlaps on small screens',
  'my subscription renewed twice this month, please check',
  'feature request: webhooks for comment events',
  'the search index seems a few hours stale',
  'love the latest release notes, keep them coming',
]

const lines: string[] = []
const truthIds: string[] = []
let c = 0
let p = 0
let n = 0
for (let i = 1; i <= 2000; i++) {
  const id = `[T${10000 + i}]`
  if (i % 50 === 0 && c < 40) {
    lines.push(`${id} ${complaints[c]} (order ${7000 + i})`)
    truthIds.push(id)
    c++
  } else if (i % 97 === 0 && p < 10) {
    lines.push(`${id} ${positiveShipping[p]}`)
    p++
  } else if (i % 83 === 0 && n < 10) {
    lines.push(`${id} ${neutralShipping[n]}`)
    n++
  } else {
    lines.push(`${id} ${filler[i % filler.length]} (ref ${i * 3})`)
  }
}

await Bun.write('bench/tickets.txt', lines.join('\n') + '\n')
await Bun.write(
  'bench/shipping-truth.json',
  JSON.stringify({ complaints: c, positive: p, neutral: n, truthIds }, null, 2)
)
console.log(`wrote bench/tickets.txt: ${c} unique complaints, ${p} positive, ${n} neutral`)
