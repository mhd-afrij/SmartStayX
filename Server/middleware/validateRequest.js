// validateRequest.js — Zod schema validation middleware for request bodies
// Remove keys from target that are absent in source, then merge source into target.
const syncObject = (target, source) => {
  if (!target || typeof target !== 'object') return
  Object.keys(target).forEach((key) => {
    if (!(key in source)) delete target[key]
  })
  Object.assign(target, source)
}

// Factory that returns Express middleware — validates body, query, or params with Zod schemas.
const validateRequest = ({ body, query, params } = {}) => {
  return (req, res, next) => {
    try {
      // Validate and replace request body with parsed data.
      if (body) {
        const result = body.safeParse(req.body)
        if (!result.success) {
          return res.status(400).json({ success: false, errors: result.error.flatten() })
        }
        req.body = result.data
      }

      // Validate and sync query parameters with parsed data.
      if (query) {
        const result = query.safeParse(req.query)
        if (!result.success) {
          return res.status(400).json({ success: false, errors: result.error.flatten() })
        }
        syncObject(req.query, result.data)
      }

      // Validate and sync route params with parsed data.
      if (params) {
        const result = params.safeParse(req.params)
        if (!result.success) {
          return res.status(400).json({ success: false, errors: result.error.flatten() })
        }
        syncObject(req.params, result.data)
      }

      return next()
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid request' })
    }
  }
}

export default validateRequest
