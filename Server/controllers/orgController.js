import Organization from "../models/Organization.js";

export const getOrgById = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.json({ success: false, message: "Organization not found" });
    }
    return res.json({ success: true, org });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCurrentOrg = async (req, res) => {
  try {
    if (!req.orgId) {
      return res.json({ success: false, message: "No active organization" });
    }
    const org = await Organization.findById(req.orgId);
    if (!org) {
      return res.json({ success: false, message: "Organization not found" });
    }
    return res.json({ success: true, org, orgRole: req.orgRole, orgSlug: req.orgSlug });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
