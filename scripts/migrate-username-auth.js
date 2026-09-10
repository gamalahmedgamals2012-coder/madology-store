require("dotenv").config();
const mongoose = require("mongoose");

function usernameBase(value) {
  return String(value || "user").toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 24) || "user";
}

async function migrate() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000, family: 4 });
  const db = mongoose.connection.db;
  const users = db.collection("users");
  const orders = db.collection("orders");
  const used = new Set((await users.find({ username: { $exists: true, $ne: null } }, { projection: { username: 1 } }).toArray()).map((user) => String(user.username).toLowerCase()));
  const operations = [];

  for await (const user of users.find({})) {
    let username = usernameBase(user.username || user.name || String(user.email || "").split("@")[0]);
    const original = username;
    let suffix = 1;
    while (used.has(username) && String(user.username || "").toLowerCase() !== username) username = `${original.slice(0, 24 - String(suffix).length - 1)}_${suffix++}`;
    used.add(username);
    operations.push({ updateOne: { filter: { _id: user._id }, update: { $set: { username }, $unset: { email: "", verified: "", emailVerified: "", verificationToken: "", verificationTokenExpires: "", passwordResetTokenHash: "", passwordResetTokenExpiresAt: "" } } } });
  }
  if (operations.length) await users.bulkWrite(operations, { ordered: true });
  await users.dropIndex("email_1").catch(() => {});
  await orders.updateMany({ "customer.email": { $exists: true } }, { $unset: { "customer.email": "" } });
  await users.createIndex({ username: 1 }, { unique: true, name: "username_1" });
  console.log(`Migrated ${operations.length} users. No users or orders were deleted.`);
  await mongoose.disconnect();
}

migrate().catch(async (error) => { console.error("Username migration failed:", error.message); await mongoose.disconnect(); process.exitCode = 1; });
