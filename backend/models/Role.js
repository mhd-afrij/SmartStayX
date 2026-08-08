import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: "" },
  dashboardAccess: { type: String, enum: ["none", "owner", "receptionist"], default: "none" },
}, { timestamps: true });

const DEFAULT_ROLES = [
  { name: "owner", description: "Full hotel owner access", dashboardAccess: "owner" },
  { name: "receptionist", description: "Front desk / reception access", dashboardAccess: "receptionist" },
  { name: "admin", description: "Platform administrator", dashboardAccess: "owner" },
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
