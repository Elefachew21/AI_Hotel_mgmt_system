import dotenv from "dotenv";
import http from "http";

import app from "./src/app.js";
import connectDatabase from "./src/config/database.js";
import { initializeSocket } from "./src/config/socket.js";

dotenv.config();

const PORT = process.env.PORT || 3132;

const startServer = async () => {
  await connectDatabase();

  const server = http.createServer(app);

  initializeSocket(server);

  server.listen(PORT, () => {
    console.log(`Gethéva Hotel server running on port ${PORT}`);
  });
};

startServer();