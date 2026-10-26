import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import roleRoutes from "./routes/role.routes.js";
import staffCreationPolicyRoutes from "./routes/staffCreationPolicy.routes.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
const app = express();
app.use(helmet());
app.use(cors());
app.use(requestLogger);
app.use(express.json());
// Routes for authentication and Authorization
app.use("/api/auth", authRoutes);
// test route for authorization and authentication

// user routing API
app.use("/api/users", userRoutes);

app.get("/api", (req, res) => {
  res.send("Gethéva Hotel server is running");
});
// role routing API
app.use("/api/roles", roleRoutes);
// staffcreationPolicy routing Base API
app.use("/api/staff-creation-policies", staffCreationPolicyRoutes);
//404 error handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
