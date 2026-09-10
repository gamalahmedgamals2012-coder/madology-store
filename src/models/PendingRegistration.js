const mongoose = require("mongoose");

// Registration details live here only until the email code is confirmed.
// MongoDB removes expired records automatically through the TTL index.
const pendingRegistrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    address: { type: String, required: true, trim: true },
    addressDetails: { type: mongoose.Schema.Types.Mixed, default: undefined },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    verificationToken: { type: String, required: true },
    verificationTokenExpires: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PendingRegistration", pendingRegistrationSchema);
