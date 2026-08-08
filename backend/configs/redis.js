import Redis from 'ioredis'
import logger from '../utils/logger.js'

let redisClient = null

const buildRedisConfig = () => {
  const url = process.env.REDIS_URL
  if (url) {
    return {
      url,
      isTls: url.startsWith('rediss://'),
    }
  }

  const host = process.env.REDIS_HOST
  const port = Number(process.env.REDIS_PORT || 6379)
  const username = process.env.REDIS_USERNAME || 'default'
  const password = process.env.REDIS_PASSWORD
  const isTls = String(process.env.REDIS_TLS || 'false').toLowerCase() === 'true'

  if (!host || !password) {
    return null
  }

  return {
    host,
    port,
    username,
    password,
    isTls,
  }
}

export const connectRedis = async () => {
  if (redisClient) return redisClient

  const config = buildRedisConfig()
  if (!config) {
    logger.info('Redis disabled: missing REDIS_URL or REDIS_HOST/REDIS_PASSWORD')
    return null
  }

  // lazyConnect keeps the client from auto-connecting so the single
  // `connect()` below is the only connection trigger (avoids ioredis's
  // "Redis is already connecting/connected" error).
  const baseOptions = {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    // Give up reconnecting after a few attempts instead of retrying forever.
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
  }

  redisClient = config.url
    ? new Redis(config.url, baseOptions)
    : new Redis({
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        tls: config.isTls ? {} : undefined,
        ...baseOptions,
      })

  redisClient.on('error', (err) => {
    logger.error('Redis Client Error: %s', err.message)
  })

  redisClient.on('connect', () => {
    logger.info('Redis connected')
  })

  // Redis is an optional cache. If it is unreachable, degrade gracefully
  // instead of crashing server startup.
  try {
    await redisClient.connect()
  } catch (err) {
    logger.warn('Redis unavailable, continuing without cache: %s', err.message)
    redisClient.removeAllListeners()
    redisClient.disconnect()
    redisClient = null
    return null
  }

  return redisClient
}

export const getRedis = () => redisClient

export const disconnectRedis = async () => {
  if (!redisClient) return
  await redisClient.quit()
  redisClient = null
}

export const invalidateRoomCache = async () => {
  if (!redisClient) return
  const keys = await redisClient.keys('rooms:list:*')
  if (keys.length > 0) {
    await redisClient.del(keys)
  }
}

export default { connectRedis, getRedis, disconnectRedis, invalidateRoomCache }
