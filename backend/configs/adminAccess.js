import Role from "../models/Role.js";

const DEFAULT_ADMIN_DASHBOARD_ACCESS = "super_admin";

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

// Maps legacy / Clerk role strings to the current enum:
// ["guest", "receptionist", "hotel_manager", "super_admin"].
// Unknown values fall back to "guest".
export const normalizeRole = (role) => {
  const key = String(role || "").trim().toLowerCase();
  const ROLE_MAP = {
    // Legacy strings
    hotelowner: "hotel_manager",
    owner: "hotel_manager",
    admin: "super_admin",
    staff: "receptionist",
    user: "guest",
    // Current strings (pass-through)
    super_admin: "super_admin",
    hotel_manager: "hotel_manager",
    receptionist: "receptionist",
    guest: "guest",
  };
  return ROLE_MAP[key] || "guest";
};

export const getConfiguredAdminEmails = () =>
  String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);

// Note: ADMIN_EMAILS acts as a permanent override — matching users are
// force-promoted to the "super_admin" role on every authenticated request (and
// by the Clerk webhook), so a UI demotion will not stick while the email stays
// configured. Remove the email from ADMIN_EMAILS to demote.
export const isAdminEmail = (email = "") => getConfiguredAdminEmails().includes(normalizeEmail(email));

const getAdminDashboardAccess = () => {
  const access = String(process.env.ADMIN_DASHBOARD_ACCESS || DEFAULT_ADMIN_DASHBOARD_ACCESS).trim();
  return ["none", "super_admin", "hotel_manager", "receptionist"].includes(access)
    ? access
    : DEFAULT_ADMIN_DASHBOARD_ACCESS;
};

// Authoritative default-role → dashboardAccess mapping.
// Overrides stale Role documents so legacy role strings never break access.
const DEFAULT_ACCESS = {
  super_admin: "super_admin",
  hotel_manager: "hotel_manager",
  receptionist: "receptionist",
  guest: "none",
};

export const resolveDashboardAccess = async (user, orgRole) => {
  let roleAccess;

  // Authoritative defaults take priority over Role collection documents
  if (Object.prototype.hasOwnProperty.call(DEFAULT_ACCESS, user.role)) {
    roleAccess = DEFAULT_ACCESS[user.role];
  } else {
    const roleDoc = await Role.findOne({ name: user.role }).lean();
    roleAccess = roleDoc?.dashboardAccess || "none";
  }

  const userEmail = normalizeEmail(user.email);
  if (getConfiguredAdminEmails().includes(userEmail)) {
    return getAdminDashboardAccess();
  }

  if (orgRole === "admin" || orgRole === "org:admin") {
    roleAccess = "hotel_manager";
  } else if (orgRole === "basic_member" || orgRole === "org:member") {
    if (roleAccess === "none") {
      roleAccess = "receptionist";
    }
  }

  return roleAccess;
};
