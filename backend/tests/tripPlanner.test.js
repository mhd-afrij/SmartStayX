// tripPlanner.test.js — Pure unit tests for the security-critical Trip Planner
// helpers. No database or live Google calls: hotelLocationPoint validates the
// GeoJSON [lng, lat] ↔ {lat, lng} contract that anchors every route origin,
// and resolveAccess enforces staff hotel-scope isolation.
import test from 'node:test'
import assert from 'node:assert/strict'
import { hotelLocationPoint, resolveAccess } from '../controllers/tripPlannerController.js'

const scopeHotels = {
  alice: 'hotel-123',
  none: null,
}

const fakeScopeResolver = (user) => Promise.resolve(scopeHotels[user?.scopeKey] ?? null)

// ── hotelLocationPoint ────────────────────────────────────────────────────
test('hotelLocationPoint extracts { lat, lng } from GeoJSON [lng, lat]', () => {
  const point = hotelLocationPoint({ location: { coordinates: [79.8431, 6.9271] } })
  assert.deepEqual(point, { lat: 6.9271, lng: 79.8431 })
})

test('hotelLocationPoint rejects coordinates outside valid ranges', () => {
  assert.equal(hotelLocationPoint({ location: { coordinates: [200, 10] } }), null)
  assert.equal(hotelLocationPoint({ location: { coordinates: [80, 95] } }), null)
  assert.equal(hotelLocationPoint({ location: { coordinates: ['80', '10'] } }), null)
  assert.equal(hotelLocationPoint({ location: { coordinates: [NaN, 10] } }), null)
})

test('hotelLocationPoint rejects missing or malformed locations', () => {
  assert.equal(hotelLocationPoint({}), null)
  assert.equal(hotelLocationPoint({ location: {} }), null)
  assert.equal(hotelLocationPoint({ location: { coordinates: [1] } }), null)
  assert.equal(hotelLocationPoint({ location: { coordinates: [1, 2, 3] } }), null)
  assert.equal(hotelLocationPoint(null), null)
})

// ── resolveAccess ─────────────────────────────────────────────────────────
test('super_admin can access any hotel', async () => {
  const req = { user: { role: 'super_admin' } }
  assert.deepEqual(await resolveAccess(req, 'any-hotel'), { allowed: true, scope: null })
  assert.deepEqual(await resolveAccess(req, null), { allowed: true, scope: null })
})

test('manager/receptionist allowed only on their assigned hotel', async () => {
  const req = { user: { role: 'hotel_manager', scopeKey: 'alice' } }
  assert.equal((await resolveAccess(req, 'hotel-123', fakeScopeResolver)).allowed, true)
  assert.equal((await resolveAccess(req, 'hotel-999', fakeScopeResolver)).allowed, false)
  // Without a hotelId the assigned scope itself is permitted.
  const scoped = await resolveAccess(req, null, fakeScopeResolver)
  assert.equal(scoped.allowed, true)
  assert.equal(scoped.scope, 'hotel-123')
})

test('receptionist without a hotel scope is denied', async () => {
  const req = { user: { role: 'receptionist', scopeKey: 'none' } }
  assert.equal((await resolveAccess(req, 'hotel-123', fakeScopeResolver)).allowed, false)
  assert.equal((await resolveAccess(req, null, fakeScopeResolver)).allowed, false)
})

test('guests may use any (approved) hotel', async () => {
  const req = { user: { role: 'guest' } }
  assert.deepEqual(await resolveAccess(req, 'hotel-1'), { allowed: true, scope: null })
  assert.deepEqual(await resolveAccess(req, null), { allowed: true, scope: null })
})