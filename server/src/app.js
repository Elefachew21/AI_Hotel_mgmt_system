import express from "express";
import cors from "cors";
import helmet from "helmet";
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.get("/api/check", (req, res) => {
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

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
    
    
});
export default app;
