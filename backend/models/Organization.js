import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    createdBy: { type: String, ref: "User", required: true },
    membersCount: { type: Number, default: 1 },
    maxAllowedMemberships: { type: Number, default: 5 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;
