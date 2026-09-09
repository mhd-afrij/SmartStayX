// tripPlanner.test.js — Trip Planner backend tests (no live server required).
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const serverRoot = path.resolve(__dirname, '..')

const read = (relativePath) => fs.readFileSync(path.join(serverRoot, relativePath), 'utf8')

test('trip routes expose the expected contract paths', () => {
  const tripRoutes = read('routes/tripRoutes.js')
  assert.match(tripRoutes, /hotel-location/)
  assert.match(tripRoutes, /tripRouter\.post\("\/"/)
  assert.match(tripRoutes, /tripRouter\.get\("\/:id"/)
  assert.match(tripRoutes, /tripRouter\.put\("\/:id"/)
  assert.match(tripRoutes, /tripRouter\.delete\("\/:id"/)
  assert.match(tripRoutes, /tripRouter\.post\("\/:id\/stops"/)
  assert.match(tripRoutes, /tripRouter\.put\("\/:id\/stops-reorder"/)
  assert.match(tripRoutes, /protect/)
})

test('places routes expose the trip planner endpoints', () => {
  const placesRoutes = read('routes/placesRoutes.js')
  assert.match(placesRoutes, /nearby/)
  assert.match(placesRoutes, /search/)
  assert.match(placesRoutes, /reverse-geocode/)
  assert.match(placesRoutes, /directions/)
  // Legacy endpoints kept for existing consumers
  assert.match(placesRoutes, /attractions/)
  assert.match(placesRoutes, /restaurants/)
  assert.match(placesRoutes, /geocode/)
})

test('server mounts trip routes and no longer mounts the removed itinerary module', () => {
  const server = read('server.js')
  assert.match(server, /app\.use\('\/api\/trips', tripRouter\)/)
  assert.doesNotMatch(server, /itinerary/)
})

test('trip controller enforces hotel scoping on stop and trip mutations', () => {
  const controller = read('controllers/tripController.js')
  // Every trip-scoped handler goes through loadAuthorizedTrip (scope check).
  const scopedHandlers = [
    'getTrip',
    'updateTrip',
    'deleteTrip',
    'addStop',
    'updateStop',
    'deleteStop',
    'reorderStops',
  ]
  for (const handler of scopedHandlers) {
    const start = controller.indexOf(`export const ${handler} = async`)
    assert.ok(start !== -1, `${handler} exists in the controller`)
    const next = controller.indexOf('export const', start + 1)
    const section = next === -1 ? controller.slice(start) : controller.slice(start, next)
    assert.match(section, /loadAuthorizedTrip/, `${handler} must verify trip ownership`)
  }
})

test('hotel model defines the trip planner location fields', () => {
  const hotel = read('models/Hotel.js')
  assert.match(hotel, /location/)
  assert.match(hotel, /coordinates/)
  assert.match(hotel, /country/)
})

test('trip model requires hotel reference and ordered stops', () => {
  const trip = read('models/Trip.js')
  assert.match(trip, /hotel:\s*\{ type: mongoose\.Schema\.Types\.ObjectId, ref: "Hotel", required: true/)
  assert.match(trip, /startLocation/)
  assert.match(trip, /stopDuration/)
  assert.match(trip, /timestamps: true/)
})

test('geoUtils resolves the canonical hotel without hardcoding ids', () => {
  const geo = read('utils/geoUtils.js')
  assert.match(geo, /resolveUserHotel/)
  assert.match(geo, /assignedHotel/)
  assert.match(geo, /owner: user\._id/)
  assert.match(geo, /haversineKm/)
})

test('places controller normalizes multi-waypoint directions with road routing', () => {
  const places = read('controllers/placesController.js')
  assert.match(places, /waypoints/)
  assert.match(places, /optimize:false/)
  assert.match(places, /overview_polyline/)
  // Friendly errors, never raw API messages
  assert.match(places, /No route is available between these locations\./)
  assert.match(places, /Unable to calculate this route\./)
})
