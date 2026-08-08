import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const serverRoot = path.resolve(__dirname, '..')
const baseUrl = process.env.TEST_BASE_URL || process.env.SERVER_BASE_URL || 'http://localhost:3000'

const read = (relativePath) => fs.readFileSync(path.join(serverRoot, relativePath), 'utf8')

test('route contract files expose the expected booking and pricing paths', () => {
  const bookingRoutes = read('routes/bookingRoutes.js')
  const pricingRoutes = read('routes/pricingRoutes.js')
  const pricingMlRoutes = read('routes/pricingMLRoutes.js')

  assert.match(bookingRoutes, /\/check-availability/)
  assert.match(bookingRoutes, /\/calculate-price/)
  assert.match(bookingRoutes, /\/create-checkout-session/)
  assert.match(pricingRoutes, /\/suggest/)
  assert.match(pricingRoutes, /\/occupancy/)
  assert.match(pricingMlRoutes, /\/enhanced/)
})

test('root endpoint is reachable', async () => {
  const response = await fetch(baseUrl)
  assert.equal(response.status, 200)
  const body = await response.text()
  assert.match(body, /API is Working/)
})
