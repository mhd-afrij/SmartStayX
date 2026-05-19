const syncObject = (target, source) => {
  if (!target || typeof target !== 'object') return
  Object.keys(target).forEach((key) => {
    if (!(key in source)) delete target[key]
  })
  Object.assign(target, source)
}

const validateRequest = ({ body, query, params } = {}) => {
  return (req, res, next) => {
    try {
      if (body) {
        const result = body.safeParse(req.body)
        if (!result.success) {
          return res.status(400).json({ success: false, errors: result.error.flatten() })
        }
        req.body = result.data
      }

      if (query) {
        const result = query.safeParse(req.query)
        if (!result.success) {
          return res.status(400).json({ success: false, errors: result.error.flatten() })
        }
        syncObject(req.query, result.data)
      }

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
