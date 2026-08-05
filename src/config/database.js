const mongoose = require("mongoose");

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

  console.log("✅ MongoDB connected successfully");
}

module.exports = connectToDatabase;