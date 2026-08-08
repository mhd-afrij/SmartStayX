import User from "../models/User.js";
import Organization from "../models/Organization.js";
import { Webhook } from "svix";
import { PLACEHOLDER_IMAGE_URL } from "../configs/runtimeDefaults.js";

const upsertUser = async (data) => {
  const userData = {
    _id: data.id,
    email: data.email_addresses?.[0]?.email_address || "",
    username: [data.first_name, data.last_name].filter(Boolean).join(" ") || data.username || "Guest",
    name: [data.first_name, data.last_name].filter(Boolean).join(" ") || data.username || "Guest",
    image: data.image_url || PLACEHOLDER_IMAGE_URL,
    ...(data.public_metadata?.role ? { role: data.public_metadata.role } : {}),
  };
  await User.findByIdAndUpdate(data.id, userData, { upsert: true, new: true });
};

const deleteUser = async (data) => {
  await User.findByIdAndDelete(data.id);
};

const upsertOrganization = async (data) => {
  const orgData = {
    _id: data.id,
    name: data.name,
    slug: data.slug,
    imageUrl: data.image_url || "",
    createdBy: data.created_by,
    membersCount: data.members_count || 1,
    maxAllowedMemberships: data.max_allowed_memberships || 5,
    metadata: data.public_metadata || {},
  };
  await Organization.findByIdAndUpdate(data.id, orgData, { upsert: true, new: true });
};

const deleteOrganization = async (data) => {
  await Organization.findByIdAndDelete(data.id);
};

const clerkWebhooks = async (req, res) => {
  try {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return res.status(500).json({ success: false, message: "CLERK_WEBHOOK_SECRET is not configured" });
    }

    const wh = new Webhook(webhookSecret);

    const headers = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    };

    let rawBody = req.rawBody;
    if (typeof rawBody !== "string") {
      if (Buffer.isBuffer(req.body)) {
        rawBody = req.body.toString("utf8");
      } else if (typeof req.body === "string") {
        rawBody = req.body;
      }
    }

    if (typeof rawBody !== "string" || !rawBody.length) {
      return res.status(400).json({
        success: false,
        message: "Missing raw body for Svix verification",
      });
    }

    const evt = wh.verify(rawBody, headers);
    const { data, type } = evt;

    switch (type) {
      case "user.created":
      case "user.updated":
        await upsertUser(data);
        break;
      case "user.deleted":
        await deleteUser(data);
        break;
      case "organization.created":
      case "organization.updated":
        await upsertOrganization(data);
        break;
      case "organization.deleted":
        await deleteOrganization(data);
        break;
      case "organizationMembership.created":
      case "organizationMembership.updated":
        await upsertOrganization(data.organization);
        break;
      case "organizationMembership.deleted":
        break;
    }

    return res.json({ success: true, message: "Webhook received" });
  } catch (error) {
    console.error(error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export default clerkWebhooks;
