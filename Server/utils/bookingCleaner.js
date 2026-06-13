// bookingCleaner.js — Periodic cleanup job for expired booking holds
import Booking from '../models/Booking.js'
import logger from './logger.js'
import bookingConfig from '../configs/bookingConfig.js'

// Periodic background job that expires pending bookings past their hold window.

let intervalId = null

export const startBookingCleaner = (options = {}) => {
  const intervalMs = (options.intervalMinutes || bookingConfig.holdCleanupIntervalMinutes) * 60 * 1000
  if (intervalId) return

  intervalId = setInterval(async () => {
    try {
      const now = new Date()
      const res = await Booking.updateMany(
        { status: 'pending', holdExpiresAt: { $lte: now } },
        { $set: { status: 'expired' } }
      )
      if (res.modifiedCount && res.modifiedCount > 0 && logger?.info) {
        logger.info('Released %d expired booking holds', res.modifiedCount)
      }
    } catch (err) {
      logger.error('bookingCleaner error: %s', err.message)
    }
  }, intervalMs)

  if (process.env.BOOKING_CLEANER_LOGS === 'true') {
    logger.info('Booking cleaner started (every %d ms)', intervalMs)
  }
}

export const stopBookingCleaner = () => {
  if (!intervalId) return
  clearInterval(intervalId)
  intervalId = null
  logger.info('Booking cleaner stopped')
}

export default startBookingCleaner
