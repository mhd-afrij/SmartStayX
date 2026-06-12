import User from '../models/User.js'
import { CLERK_API_BASE_URL, PLACEHOLDER_IMAGE_URL } from '../configs/runtimeDefaults.js'
import mongoose from 'mongoose'
import bookingConfig from '../configs/bookingConfig.js'

// Auth middleware — resolves Clerk JWT to a local User document, creating or updating as needed.
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
      ''

    let user = await User.findById(userId)

    // Fetch user profile from Clerk API when session claims lack name data.
    const fetchClerkUser = async () => {
      const clerkSecret = process.env.CLERK_SECRET_KEY
      if (!clerkSecret) return null
      try {
        const response = await fetch(`${CLERK_API_BASE_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${clerkSecret}` },
        })
        if (!response.ok) return null
        return await response.json()
      } catch {
        return null
      }
    }

    const resolveName = async () => {
      if (fullName) return fullName
      if (usernameClaim) return usernameClaim
      const clerkData = await fetchClerkUser()
      if (clerkData) {
        const clerkName = [clerkData.first_name, clerkData.last_name].filter(Boolean).join(' ').trim()
        if (clerkName) return clerkName
        if (clerkData.username) return clerkData.username
      }
      return 'Guest'
    }

    const resolvedName = await resolveName()
    const resolvedUsername = usernameClaim || resolvedName

    let needsUpdate = false

    if (user) {
      const updates = {}
      if (!user.name || user.name === 'Guest') {
        updates.name = resolvedName
        needsUpdate = true
      }
      if ((!user.username || user.username === 'Guest') && resolvedUsername && resolvedUsername !== 'Guest') {
        updates.username = resolvedUsername
        needsUpdate = true
      }
      if (
        (!user.email || String(user.email).endsWith(bookingConfig.placeholderEmailDomain)) &&
        email &&
        !String(email).endsWith(bookingConfig.placeholderEmailDomain)
      ) {
        updates.email = email
        needsUpdate = true
      }
      if ((!user.image || user.image === PLACEHOLDER_IMAGE_URL) && imageClaim) {
        updates.image = imageClaim
        needsUpdate = true
      }
      if (needsUpdate) {
        user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true })
      }
    }

    if (!user) {
      user = await User.findByIdAndUpdate(
        userId,
        {
          $setOnInsert: {
            _id: userId,
            name: resolvedName,
            username: resolvedUsername,
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
