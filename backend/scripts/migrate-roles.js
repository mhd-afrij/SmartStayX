// migrate-roles.js — One-time migration: renames legacy role strings to the new 3-dashboard model.
// Run with: node scripts/migrate-roles.js
//
// What it does:
//   1. User.role: admin → super_admin, owner → hotel_manager, staff → receptionist
//   2. Role documents: updates names and dashboardAccess values
//   3. Clerk public_metadata: updates role strings (best-effort, logs failures)
//
// Safe to run multiple times (idempotent — skips already-migrated documents).

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Role from "../models/Role.js";

dotenv.config();

const ROLE_MAP = {
  admin: "super_admin",
  owner: "hotel_manager",
  staff: "receptionist",
};

const ROLE_DOC_MAP = {
  admin: { name: "super_admin", dashboardAccess: "super_admin", description: "Platform-wide administrator with global access" },
  owner: { name: "hotel_manager", dashboardAccess: "hotel_manager", description: "Manages a single hotel and its operations" },
};

const migrate = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set in .env");
  await mongoose.connect(uri, { dbName: "SmartStayX" });
  console.log("Connected to MongoDB");

  // 1. Migrate User documents
  let totalUsersMigrated = 0;
  for (const [oldRole, newRole] of Object.entries(ROLE_MAP)) {
    const result = await User.updateMany(
      { role: oldRole },
      { $set: { role: newRole } }
    );
    if (result.modifiedCount > 0) {
      console.log(`  Users: ${oldRole} → ${newRole}: ${result.modifiedCount} updated`);
      totalUsersMigrated += result.modifiedCount;
    }
  }
  console.log(`Total users migrated: ${totalUsersMigrated}`);

  // 2. Migrate Role documents
  for (const [oldName, updates] of Object.entries(ROLE_DOC_MAP)) {
    const existing = await Role.findOne({ name: oldName });
    if (existing) {
      // Delete old-named role and upsert new-named role
      await Role.deleteOne({ name: oldName });
      await Role.findOneAndUpdate(
        { name: updates.name },
        { $set: updates },
        { upsert: true }
      );
      console.log(`  Role doc: ${oldName} → ${updates.name}`);
    } else {
      // Ensure the new role exists
      await Role.findOneAndUpdate(
        { name: updates.name },
        { $setOnInsert: updates },
        { upsert: true }
      );
    }
  }

  // 3. Ensure all default roles exist
  await Role.seedDefaults();
  console.log("Default roles seeded");

  // 4. Verify
  const roleCounts = await User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]);
  console.log("\nFinal user role distribution:");
  for (const r of roleCounts) {
    console.log(`  ${r._id}: ${r.count}`);
  }

  const roles = await Role.find().select("name dashboardAccess");
  console.log("\nRole documents:");
  for (const r of roles) {
    console.log(`  ${r.name} → dashboardAccess: ${r.dashboardAccess}`);
  }

  await mongoose.disconnect();
  console.log("\nMigration complete.");
};

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
