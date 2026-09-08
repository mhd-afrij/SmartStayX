import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: "" },
  dashboardAccess: { type: String, enum: ["none", "super_admin", "hotel_manager", "receptionist"], default: "none" },
}, { timestamps: true });

const DEFAULT_ROLES = [
  { name: "super_admin", description: "Platform-wide administrator with global access", dashboardAccess: "super_admin" },
  { name: "hotel_manager", description: "Manages a single hotel and its operations", dashboardAccess: "hotel_manager" },
  { name: "receptionist", description: "Front desk / reception operations", dashboardAccess: "receptionist" },
  { name: "guest", description: "Guest account — public browsing only", dashboardAccess: "none" },
  { name: "none", description: "No dashboard access", dashboardAccess: "none" },
];

roleSchema.statics.seedDefaults = async function () {
  for (const role of DEFAULT_ROLES) {
    await this.findOneAndUpdate(
      { name: role.name },
      { $setOnInsert: role },
      { upsert: true }
    );
  }
};

const Role = mongoose.model("Role", roleSchema);

export default Role;
