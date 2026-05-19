import User from '../models/User.js'
import { PLACEHOLDER_IMAGE_URL } from '../configs/runtimeDefaults.js'
import mongoose from 'mongoose'
import bookingConfig from '../configs/bookingConfig.js'

export const protect = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database unavailable' })
    }

    const auth = typeof req.auth === 'function' ? req.auth() : req.auth
    const userId = auth?.userId

    if (!userId) {
      return res.json({ success: false, message: 'not authenticated' })
    }

    const claims = auth?.sessionClaims || {}

    const firstName =
      claims?.firstName ||
      claims?.first_name ||
      claims?.givenName ||
      claims?.given_name ||
      ''
    const lastName =
      claims?.lastName ||
      claims?.last_name ||
      claims?.familyName ||
      claims?.family_name ||
      ''
    const usernameClaim =
      claims?.username ||
      claims?.preferred_username ||
      claims?.preferredUsername ||
      ''
    const emailClaim =
      claims?.email ||
      claims?.email_address ||
      claims?.emailAddress ||
      (Array.isArray(claims?.email_addresses) && claims.email_addresses[0]?.email_address)
    const imageClaim = claims?.imageUrl || claims?.image_url || claims?.picture || ''
    const email = emailClaim || `${userId}${bookingConfig.placeholderEmailDomain}`

    const fullName =
      claims?.fullName ||
      claims?.full_name ||
      claims?.name ||
      [firstName, lastName].filter(Boolean).join(' ') ||
      usernameClaim ||
      'Guest'

    let user = await User.findById(userId)

    if (user) {
      const updates = {}
      if ((!user.name || user.name === 'Guest') && fullName && fullName !== 'Guest') {
        updates.name = fullName
      }
      if ((!user.username || user.username === 'Guest') && usernameClaim) {
        updates.username = usernameClaim
      }
      if (
        (!user.email || String(user.email).endsWith(bookingConfig.placeholderEmailDomain)) &&
        email &&
        !String(email).endsWith(bookingConfig.placeholderEmailDomain)
      ) {
        updates.email = email
      }
      if ((!user.image || user.image === PLACEHOLDER_IMAGE_URL) && imageClaim) {
        updates.image = imageClaim
      }
      if (Object.keys(updates).length > 0) {
        user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true })
      }
    }

    if (!user) {
      user = await User.findByIdAndUpdate(
        userId,
        {
          $setOnInsert: {
            _id: userId,
            name: fullName,
            username: usernameClaim || fullName,
            email,
            image: imageClaim || PLACEHOLDER_IMAGE_URL,
            recentSearchedCities: [],
          },
        },
        { upsert: true, new: true }
      )
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Auth middleware error:', error.message)
    return res.status(500).json({ success: false, message: 'Authentication setup failed' })
  }
}
