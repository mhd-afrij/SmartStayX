// bookingCleaner.js — Periodic cleanup job for expired booking holds
import Booking from '../models/Booking.js'
import logger from './logger.js'
import bookingConfig from '../configs/bookingConfig.js'

// Periodic background job that expires pending bookings past their hold window.

// Holds the setInterval reference for the cleaner job
let intervalId = null

// Starts the periodic booking cleaner interval that expires pending bookings past their hold window
export const startBookingCleaner = (options = {}) => {
  const intervalMs = (options.intervalMinutes || bookingConfig.holdCleanupIntervalMinutes) * 60 * 1000
  if (intervalId) return

  intervalId = setInterval(async () => {
    try {
      // Mark all pending bookings whose hold has expired
      const now = new Date()
      const res = await Booking.updateMany(
        { status: 'pending', holdExpiresAt: { $lte: now } },
        { $set: { status: 'expired' } }
      )
      // Log count of expired holds if any were released
      if (res.modifiedCount && res.modifiedCount > 0 && logger?.info) {
        logger.info('Released %d expired booking holds', res.modifiedCount)
      }
    } catch (err) {
      logger.error('bookingCleaner error: %s', err.message)
    }
  }, intervalMs)

  // Optionally log that the cleaner started
  if (process.env.BOOKING_CLEANER_LOGS === 'true') {
    logger.info('Booking cleaner started (every %d ms)', intervalMs)
  }
}

// Stops the booking cleaner interval
export const stopBookingCleaner = () => {
  if (!intervalId) return
  clearInterval(intervalId)
  intervalId = null
  logger.info('Booking cleaner stopped')
}

export default startBookingCleaner
