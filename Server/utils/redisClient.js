// redisClient.js — Redis client setup for caching and booking locks
import Redis from 'ioredis'
import logger from '../utils/logger.js'
import bookingConfig from '../configs/bookingConfig.js'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

let client = null
let connecting = false
let connectPromise = null

const connect = () => {
  if (client) return client
  if (connectPromise) return connectPromise

  connecting = true
  connectPromise = new Promise((resolve) => {
    const redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) {
          logger.error('redis: max retries reached, giving up')
          return null
        }
        return Math.min(times * 200, 3000)
      },
      lazyConnect: true,
    })

    redis.on('connect', () => {
      logger.info('redis: connected')
      client = redis
      connecting = false
      connectPromise = null
      resolve(redis)
    })

    redis.on('error', (err) => {
      logger.warn('redis: error — %s', err.message)
    })

    redis.on('close', () => {
      logger.warn('redis: connection closed')
      client = null
    })

    redis.connect().catch((err) => {
      logger.warn('redis: connection failed — %s', err.message)
      connecting = false
      connectPromise = null
      resolve(null)
    })
  })

  return connectPromise
}

export const getRedis = () => client

export const initRedis = async () => {
  const r = await connect()
  if (r) {
    logger.info('redis: ready')
  } else {
    logger.warn('redis: unavailable — caching and distributed locks disabled')
  }
  return r
}

const lockPrefix = 'booking:lock'

const buildLockKey = (roomId, checkIn, checkOut) => {
  const inStr = new Date(checkIn).toISOString().slice(0, 10)
  const outStr = new Date(checkOut).toISOString().slice(0, 10)
  return `${lockPrefix}:${roomId}:${inStr}:${outStr}`
}

export const acquireLock = async (roomId, checkIn, checkOut) => {
  const redis = client
  if (!redis) return null

  const lockKey = buildLockKey(roomId, checkIn, checkOut)
  const lockValue = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const ttlMs = bookingConfig.lockTimeoutMs
  const maxRetries = bookingConfig.lockMaxRetries
  const retryDelay = bookingConfig.lockRetryDelayMs

  for (let i = 0; i < maxRetries; i++) {
    try {
      const ok = await redis.set(lockKey, lockValue, 'PX', ttlMs, 'NX')
      if (ok === 'OK') {
        logger.info('redis: lock acquired %s', lockKey)
        return { lockKey, lockValue }
      }
    } catch (err) {
      logger.warn('redis: lock attempt %d failed — %s', i + 1, err.message)
    }

    if (i < maxRetries - 1) {
      await new Promise((r) => setTimeout(r, retryDelay))
    }
  }

  logger.warn('redis: lock failed after %d retries — %s', maxRetries, lockKey)
  return null
}

const releaseScript = `
  if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
  else
    return 0
  end
`

export const releaseLock = async (lockKey, lockValue) => {
  const redis = client
  if (!redis) return

  try {
    await redis.eval(releaseScript, 1, lockKey, lockValue)
    logger.info('redis: lock released %s', lockKey)
  } catch (err) {
    logger.warn('redis: lock release failed — %s', err.message)
  }
}

const extendScript = `
  if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("PEXPIRE", KEYS[1], ARGV[2])
  else
    return 0
  end
`

export const extendLock = async (lockKey, lockValue, ttlMs) => {
  const redis = client
  if (!redis) return false

  try {
    const result = await redis.eval(extendScript, 1, lockKey, lockValue, String(ttlMs))
    return result === 1
  } catch (err) {
    logger.warn('redis: lock extend failed — %s', err.message)
    return false
  }
}

export default getRedis
