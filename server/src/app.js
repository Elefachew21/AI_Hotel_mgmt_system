import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes.js";
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
// Routes for authentication and Authorization
app.use("/api/auth",authRoutes);



app.get("/api", (req, res) => {
  res.send("Gethéva Hotel server is running");
});

//404 error handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});


// Centralized error handler
app.use((err, req, res, next) => {
    console.error(err);

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        message:
            statusCode === 500
                ? "Internal server error"
                : err.message
    });

    
    
});
export default app;
