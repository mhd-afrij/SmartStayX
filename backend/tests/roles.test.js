import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeRole, isAdminEmail, getConfiguredAdminEmails } from '../configs/adminAccess.js'

test('normalizeRole maps legacy roles to the current enum', () => {
  assert.equal(normalizeRole('hotelOwner'), 'hotel_manager')
  assert.equal(normalizeRole('hotelowner'), 'hotel_manager')
  assert.equal(normalizeRole('owner'), 'hotel_manager')
  assert.equal(normalizeRole('admin'), 'super_admin')
  assert.equal(normalizeRole('staff'), 'receptionist')
  assert.equal(normalizeRole('receptionist'), 'receptionist')
  assert.equal(normalizeRole('user'), 'guest')
  assert.equal(normalizeRole('guest'), 'guest')
})

test('normalizeRole passes through current role strings', () => {
  assert.equal(normalizeRole('super_admin'), 'super_admin')
  assert.equal(normalizeRole('hotel_manager'), 'hotel_manager')
  assert.equal(normalizeRole('receptionist'), 'receptionist')
})

test('normalizeRole falls back to guest for unknown/empty roles', () => {
  assert.equal(normalizeRole('superadmin'), 'guest')
  assert.equal(normalizeRole(''), 'guest')
  assert.equal(normalizeRole(null), 'guest')
  assert.equal(normalizeRole(undefined), 'guest')
})

test('isAdminEmail matches configured admin emails case-insensitively', () => {
  const adminEmails = getConfiguredAdminEmails()
  if (adminEmails.length === 0) {
    // No ADMIN_EMAILS configured in the environment — nothing to assert against.
    return
  }
  const [email] = adminEmails
  assert.equal(isAdminEmail(email), true)
  assert.equal(isAdminEmail(`  ${email.toUpperCase()}  `), true)
  assert.equal(isAdminEmail('someone-else@example.com'), false)
  assert.equal(isAdminEmail(''), false)
})
