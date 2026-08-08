import User from '../models/User.js';
import Organization from '../models/Organization.js';
import logger from '../utils/logger.js';

const extractAuth = (req) => {
  if (typeof req.auth === 'function') {
    return req.auth();
  }
  return req.auth;
};

const fetchClerkUser = async (userId) => {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) return null;
  try {
    const res = await fetch(
      `${process.env.CLERK_API_BASE_URL || "https://api.clerk.com/v1"}/users/${userId}`,
      { headers: { Authorization: `Bearer ${secret}` } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export const protect = async (req, res, next) => {
  let auth;
  try {
    auth = extractAuth(req);
  } catch (e) {
    logger.warn('Auth extraction threw: %s', e.message);
    auth = null;
  }

  const clerkUserId = auth?.userId;

  if (!clerkUserId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  let user;
  try {
    user = await User.findById(clerkUserId);
  } catch (dbErr) {
    logger.error('User lookup failed: %s', dbErr.message);
    return res.status(500).json({ success: false, message: 'Authentication failed' });
  }

  const resolveEmail = () => {
    return auth?.claims?.email ||
      auth?.user?.emailAddresses?.[0]?.emailAddress ||
      auth?.user?.email ||
      null;
  };

  const resolveName = () => {
    return auth?.claims?.name ||
      auth?.user?.firstName ||
      auth?.user?.name ||
      null;
  };

  const resolveImage = () => {
    return auth?.claims?.image_url ||
      auth?.claims?.picture ||
      auth?.user?.imageUrl ||
      null;
  };

  let email = resolveEmail();
  let name = resolveName();
  let image = resolveImage();

  if (!email || !name) {
    const clerkData = await fetchClerkUser(clerkUserId);
    if (clerkData) {
      email = email || clerkData.email_addresses?.[0]?.email_address || "";
      name = name || [clerkData.first_name, clerkData.last_name].filter(Boolean).join(" ") || clerkData.username || "Guest";
      image = image || clerkData.image_url || "";
    }
  }

  if (!user) {
    try {
      user = await User.create({
        _id: clerkUserId,
        name: name || 'Guest',
        username: clerkUserId,
        email: email || `${clerkUserId}@placeholder.com`,
        image: image || 'https://ui-avatars.com/api/?name=Guest',
      });
      logger.info('Created new user from Clerk: %s', clerkUserId);
    } catch (createErr) {
      logger.error('User creation failed: %s', createErr.message);
      return res.status(500).json({ success: false, message: 'Authentication failed' });
    }
  } else if (email && email !== user.email && !user.email.includes('@placeholder.com')) {
    user.email = email;
    user.name = name || user.name;
    user.image = image || user.image;
    await user.save();
  } else if (user.email.includes('@placeholder.com') && email) {
    user.email = email;
    user.name = name || user.name;
    user.image = image || user.image;
    await user.save();
    logger.info('Updated placeholder user: %s', clerkUserId);
  }

  req.user = user;

  const orgId = req.headers['x-org-id'] || auth?.orgId || null;
  const orgRole = req.headers['x-org-role'] || auth?.orgRole || null;

  if (orgId) {
    try {
      const org = await Organization.findById(orgId);
      if (org) {
        req.org = org;
        req.orgId = org._id;
        req.orgRole = orgRole;
        req.orgSlug = org.slug;
      }
    } catch (orgErr) {
      logger.warn('Org lookup failed: %s', orgErr.message);
    }
  }

  next();
};
