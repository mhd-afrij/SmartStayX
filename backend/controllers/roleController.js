import Role from "../models/Role.js";
import User from "../models/User.js";

const PROTECTED_ROLES = ["owner", "receptionist", "admin", "none"];

export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    const userCounts = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    for (const entry of userCounts) {
      countMap[entry._id] = entry.count;
    }
    const rolesWithCount = roles.map((role) => ({
      ...role.toObject(),
      userCount: countMap[role.name] || 0,
    }));
    res.json({ success: true, roles: rolesWithCount });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const createRole = async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized" });
    }
    const { name, description, dashboardAccess } = req.body;
    if (!name || !name.trim()) {
      return res.json({ success: false, message: "Role name is required" });
    }
    const slug = name.trim().toLowerCase().replace(/\s+/g, "");
    const existing = await Role.findOne({ name: slug });
    if (existing) {
      return res.json({ success: false, message: "Role already exists" });
    }
    const role = await Role.create({
      name: slug,
      description: description || "",
      dashboardAccess: ["owner", "receptionist", "none"].includes(dashboardAccess) ? dashboardAccess : "none",
    });
    res.json({ success: true, message: "Role created", role });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized" });
    }
    const { id } = req.params;
    const { name, description, dashboardAccess } = req.body;
    const updates = {};
    if (name) updates.name = name.trim().toLowerCase().replace(/\s+/g, "");
    if (description !== undefined) updates.description = description;
    if (dashboardAccess !== undefined && ["owner", "receptionist", "none"].includes(dashboardAccess)) {
      updates.dashboardAccess = dashboardAccess;
    }
    const role = await Role.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!role) return res.json({ success: false, message: "Role not found" });
    res.json({ success: true, message: "Role updated", role });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const deleteRole = async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized" });
    }
    const { id } = req.params;
    const role = await Role.findById(id);
    if (!role) return res.json({ success: false, message: "Role not found" });
    if (PROTECTED_ROLES.includes(role.name)) {
      return res.json({ success: false, message: `Cannot delete protected role "${role.name}"` });
    }
    await User.updateMany({ role: role.name }, { role: "user" });
    await Role.findByIdAndDelete(id);
    res.json({ success: true, message: `Role deleted. ${role.name} users reset to "user".` });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
