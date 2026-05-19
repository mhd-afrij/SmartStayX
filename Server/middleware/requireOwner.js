const requireOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' })
  }
  if (String(req.user.role) !== 'hotelOwner') {
    return res.status(403).json({ success: false, message: 'Owner role required' })
  }
  next()
}

export default requireOwner
