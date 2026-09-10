// securityUtils.test.js — Regression tests for shared security utilities
import test from 'node:test'
import assert from 'node:assert/strict'
import escapeRegex from '../utils/escapeRegex.js'
import { BOOKING_STATUS } from '../constants/bookingStatuses.js'

test('escapeRegex escapes all regex metacharacters (ReDoS / injection guard)', () => {
  assert.equal(escapeRegex('(.*)+'), '\\(\\.\\*\\)\\+')
  assert.equal(escapeRegex('[a-z]+'), '\\[a-z\\]\\+')
  // A malicious search term must never be able to expand a regex.
  const malicious = '((a+)+)+$^(.*)[x]|.'
  const escaped = escapeRegex(malicious)
  // Every regex metacharacter must be backslash-escaped (preceded by \\).
  assert.equal(/(^|[^\\])(\(|\)|\[|\]|\{|\}|\*|\+|\?|\||\$|\^|\.)/.test(escaped), false)
  // Anchored against the escaped pattern: matches only the literal input.
  const anchored = new RegExp(`^${escaped}$`)
  assert.equal(anchored.test(malicious), true)
  assert.equal(anchored.test('((a+)+)+$^(.*)[x]|.other'), false)
})

test('BOOKING_STATUS constants are the canonical lifecycle enum', () => {
  assert.deepEqual(Object.values(BOOKING_STATUS).sort(), [
    'cancelled',
    'checked_in',
    'checked_out',
    'confirmed',
    'expired',
    'pending',
    'reservation',
  ])
})

test('escapeRegex handles non-strings and empties without throwing', () => {
  assert.equal(escapeRegex(''), '')
  assert.equal(escapeRegex('plain text'), 'plain text')
  assert.equal(typeof escapeRegex(null), 'string')
  assert.equal(typeof escapeRegex(undefined), 'string')
  assert.equal(typeof escapeRegex({ a: 1 }), 'string')
})