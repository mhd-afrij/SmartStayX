import Redis from 'ioredis'
import crypto from 'node:crypto'
import bookingConfig from '../configs/bookingConfig.js'

let client = null

export const getRedis = () => {
  if (client) return client
  const url = process.env.REDIS_URL || null
  if (!url) return null
  client = new Redis(url)
  client.on('error', (err) => console.error('Redis error', err))
  return client
}

// -----------------------------------------------------------------------
// Distributed lock (Redis-based) for concurrency-safe booking creation
// -----------------------------------------------------------------------

const LOCK_PREFIX = 'lock:room:'

export const acquireLock = async (roomId, checkIn, checkOut) => {
  const redis = getRedis()
  if (!redis) return null

  const lockKey = `${LOCK_PREFIX}${roomId}:${checkIn.getTime()}:${checkOut.getTime()}`
  const lockValue = crypto.randomUUID()
  const ttlMs = bookingConfig.lockTimeoutMs

  for (let attempt = 0; attempt < bookingConfig.lockMaxRetries; attempt++) {
    const ok = await redis.set(lockKey, lockValue, 'PX', ttlMs, 'NX')
    if (ok === 'OK') return { lockKey, lockValue }
    await new Promise((r) => setTimeout(r, bookingConfig.lockRetryDelayMs))
  }
  return null
}

export const releaseLock = async (lockKey, lockValue) => {
  const redis = getRedis()
  if (!redis) return

  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `
  try {
    await redis.eval(script, 1, lockKey, lockValue)
  } catch {
    // best-effort
  }
}

export const extendLock = async (lockKey, lockValue, ttlMs) => {
  const redis = getRedis()
  if (!redis) return false

  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("pexpire", KEYS[1], ARGV[2])
    else
      return 0
    end
  `
  try {
    const result = await redis.eval(script, 1, lockKey, lockValue, ttlMs)
    return result === 1
  } catch {
    return false
  }
}

export default getRedis
