import crypto from "crypto";
import RestaurantTable from "../models/RestaurantTable.js";
import OrderSession from "../models/OrderSession.js";

const SESSION_DURATION_MINUTES = 60;

const generateSessionToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const createOrderSession = async (publicToken) => {
  const table = await RestaurantTable.findOne({
    publicToken,
    isActive: true,
    status: { $ne: "OUT_OF_SERVICE" }
  });

  if (!table) {
    const error = new Error("Restaurant table not found");
    error.statusCode = 404;
    throw error;
  }

  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_MINUTES * 60 * 1000
  );

  const session = await OrderSession.create({
    sessionToken: generateSessionToken(),
    table: table._id,
    status: "ACTIVE",
    expiresAt
  });

  return {
    sessionToken: session.sessionToken,
    expiresAt: session.expiresAt,
    table: {
      id: table._id,
      tableNumber: table.tableNumber
    }
  };
};

export const getActiveOrderSession = async (sessionToken) => {
  const session = await OrderSession.findOne({
    sessionToken,
    status: "ACTIVE",
    expiresAt: { $gt: new Date() }
  })
    .populate("table", "tableNumber status isActive")
    .lean();

  if (!session) {
    const error = new Error("Order session is invalid or expired");
    error.statusCode = 401;
    throw error;
  }

  if (
    !session.table ||
    !session.table.isActive ||
    session.table.status === "OUT_OF_SERVICE"
  ) {
    const error = new Error("Restaurant table is unavailable");
    error.statusCode = 409;
    throw error;
  }

  return session;
};