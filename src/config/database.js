const mongoose = require("mongoose");
const User = require("../models/User");
const Order = require("../models/Order");

function isSrvLookupFailure(error) {
  const message = error?.message || "";
  const code = error?.code || error?.cause?.code || "";

  return (
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    message.includes("querySrv") ||
    message.includes("SRV")
  );
}

async function connectToDatabase() {
  const primaryUri = process.env.MONGODB_URI;
  const fallbackUri = process.env.MONGODB_URI_FALLBACK || process.env.MONGODB_URI_DIRECT;

  if (!primaryUri) {
    throw new Error("MONGODB_URI is missing. Add it to your .env file.");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2) {
    return mongoose.connection.asPromise();
  }

  mongoose.set("strictQuery", true);

  const connectOptions = {
    serverSelectionTimeoutMS: 30000,
    family: 4,
  };

  try {
    await mongoose.connect(primaryUri, connectOptions);
  } catch (error) {
    if (fallbackUri && fallbackUri !== primaryUri && isSrvLookupFailure(error)) {
      console.warn("SRV lookup failed; retrying with direct Atlas host fallback...");
      await mongoose.connect(fallbackUri, connectOptions);
    } else {
      throw error;
    }
  }

  // Do not rely on the runtime default for autoIndex. The order idempotency
  // index is enforced by the schema; usernames are intentionally non-unique.
  await Promise.all([
    User.init(),
    Order.init(),
  ]);

  // Older deployments created unique authentication indexes. The schema no longer
  // has email, so every new document would otherwise collide on email: null.
  // Removing this obsolete index does not modify or delete any documents;
  // field cleanup remains an explicit operation in the migration script.
  await mongoose.connection.db.collection(User.collection.name).dropIndex("email_1").catch((error) => {
    if (!/index not found|not found/i.test(error.message || "")) {
      throw error;
    }
  });
  await mongoose.connection.db.collection(User.collection.name).dropIndex("username_1").catch((error) => {
    if (error.codeName !== "IndexNotFound") throw error;
  });

  console.log("✅ MongoDB connected successfully");
}

module.exports = connectToDatabase;
