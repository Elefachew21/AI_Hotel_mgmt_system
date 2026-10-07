import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import roomRoutes from "./routes/room.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import folioRoutes from "./routes/folio.routes.js";
import publicRestaurantRoutes from "./routes/publicRestaurant.routes.js";
import   restaurantManagementRoutes from "./routes/restaurantManagement.routes.js";
import kitchenOrderTicketRoutes from "./routes/kitchenOrderTicket.routes.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
// Routes for authentication and Authorization
app.use("/api/auth",authRoutes);
// test route for authorization and authentication


// user routing API
app.use("/api/users",userRoutes)

app.get("/api", (req, res) => {
  res.send("Gethéva Hotel server is running");
});
// Customer API Routing
app.use("/api/customers",customerRoutes)
 
// Room API Routing
app.use("/api/rooms", roomRoutes);
// Reservation API Routing
app.use("/api/reservations", reservationRoutes);
//payment APIRouting 
app.use("/api/payments", paymentRoutes);
app.use("/api/folios", folioRoutes);

// Restaurant public API routing
app.use("/api/public/restaurant", publicRestaurantRoutes);
// Restaurant management API Routing
app.use("/api/restaurant", restaurantManagementRoutes);

// Kot related API Routing
app.use("/api/kitchen/kots", kitchenOrderTicketRoutes);
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
