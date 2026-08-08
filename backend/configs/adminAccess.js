import Role from "../models/Role.js";

const DEFAULT_ADMIN_DASHBOARD_ACCESS = "owner";

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

export const getConfiguredAdminEmails = () =>
  String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);

const getAdminDashboardAccess = () => {
  const access = String(process.env.ADMIN_DASHBOARD_ACCESS || DEFAULT_ADMIN_DASHBOARD_ACCESS).trim();
  return ["none", "owner", "receptionist"].includes(access) ? access : DEFAULT_ADMIN_DASHBOARD_ACCESS;
};

export const resolveDashboardAccess = async (user, orgRole) => {
  const roleDoc = await Role.findOne({ name: user.role }).lean();
  let roleAccess = roleDoc?.dashboardAccess || "none";

  const userEmail = normalizeEmail(user.email);
  if (getConfiguredAdminEmails().includes(userEmail)) {
    return getAdminDashboardAccess();
  }

  if (orgRole === "admin" || orgRole === "org:admin") {
    roleAccess = "owner";
  } else if (orgRole === "basic_member" || orgRole === "org:member") {
    if (roleAccess === "none") {
      roleAccess = "receptionist";
    }
  }

  return roleAccess;
};
