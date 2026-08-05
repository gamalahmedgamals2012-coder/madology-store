require("dotenv").config();

const app = require("./src/app");
const connectToDatabase = require("./src/config/database");

const port = Number(process.env.PORT) || 3000;

async function startServer() {
  await connectToDatabase();

  app.listen(port, () => {
    console.log(`MADOLOGY backend running on port ${port}`);
  });
}

console.log("MONGO URI =", process.env.MONGODB_URI);

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});