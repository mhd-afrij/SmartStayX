// No-op Redis client: returns null / harmless stubs so the app can run
// without a Redis server. This preserves existing call sites but avoids
// connection errors when Redis is not required in local setups.

import bookingConfig from '../configs/bookingConfig.js'

export const getRedis = () => null

export const acquireLock = async (roomId, checkIn, checkOut) => {
  // If Redis is disabled/unavailable, fall back to no locking.
  return null
}

export const releaseLock = async (lockKey, lockValue) => {
  // no-op
}

export const extendLock = async (lockKey, lockValue, ttlMs) => {
  return false
}

export default getRedis
