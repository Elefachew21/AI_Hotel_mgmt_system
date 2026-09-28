import dotenv from "dotenv";
import app from "./src/app.js";
import connectDatabase from "./src/config/database.js";

dotenv.config();

const PORT = process.env.PORT || 3132;

const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Gethéva Hotel server running on port ${PORT}`);
  });
};

startServer();