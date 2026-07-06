// Big-file fixture: ~40k nested orders (~10MB) with deterministic answers.
const categories = ['electronics', 'books', 'garden', 'toys', 'grocery', 'sports', 'beauty']
const statuses = ['paid', 'shipped', 'delivered', 'refunded', 'cancelled']

const orders = Array.from({ length: 40000 }, (_, k) => {
  const i = k + 1
  const itemCount = (i % 3) + 1
  const items = Array.from({ length: itemCount }, (_, j) => ({
    sku: `SKU-${(i * 13 + j * 7) % 900}`,
    category: categories[(i + j) % 7],
    qty: (j % 2) + 1,
    price: 5 + ((i * 11 + j * 3) % 300),
  }))
  const total = items.reduce((s, it) => s + it.qty * it.price, 0)
  return {
    id: `ord-${100000 + i}`,
    status: statuses[i % 5],
    customer: { id: `cus-${i % 2000}`, country: ['JP', 'US', 'DE', 'BR'][i % 4] },
    items,
    total,
    created: `2026-0${(i % 6) + 1}-${String((i % 27) + 1).padStart(2, '0')}`,
  }
})

await Bun.write('bench/orders.json', JSON.stringify({ export: 'orders-2026H1', orders }))
console.log(
  `wrote bench/orders.json (${JSON.stringify({ orders }).length} bytes, ${orders.length} orders)`
)
