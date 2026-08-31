const app = require("../src/app");
const connectToDatabase = require("../src/config/database");

let databaseConnectionPromise = null;

function getRequestPath(req) {
  return String(req.url || "").split("?")[0];
}

function routeNeedsDatabase(req) {
  if (req.method === "OPTIONS") {
    return false;
  }

  const path = getRequestPath(req);

  return (
    path.startsWith("/auth") ||
    path.startsWith("/admin") ||
    path.startsWith("/orders") ||
    path === "/order" ||
    /^\/products\/[^/]+\/reviews\/?$/.test(path) ||
    path === "/reviews"
  );
}

async function ensureDatabaseConnection() {
  if (!databaseConnectionPromise) {
    databaseConnectionPromise = connectToDatabase().catch((error) => {
      databaseConnectionPromise = null;
      throw error;
    });
  }

  await databaseConnectionPromise;
}

module.exports = async function handler(req, res) {
  try {
    if (routeNeedsDatabase(req)) {
      await ensureDatabaseConnection();
    }
  } catch (error) {
    console.error("[DATABASE] Connection failed", {
      message: error.message,
      code: error.code
    });

    return res.status(500).json({
      success: false,
      message: "Database connection failed. Please try again later."
    });
  }

  return app(req, res);
};

module.exports.app = app;
module.exports.routeNeedsDatabase = routeNeedsDatabase;
