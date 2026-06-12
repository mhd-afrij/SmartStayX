import logger from '../utils/logger.js'

// Global error handler — logs via Winston and returns sanitized JSON to the client.
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error: %o', err)
  const status = err.status || 500
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  res.status(status).json({ success: false, message })
}

export default errorHandler
