import { createLogger, transports, format } from 'winston'

// Winston logger with JSON format, timestamps, and console transport.
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'smartstayx' },
  transports: [new transports.Console()],
})

export default logger
