import crypto from "crypto";
import RestaurantTable from "../models/RestaurantTable.js";

const generatePublicToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const createRestaurantTable = async ({
  tableNumber,
  capacity
}) => {
  const existingTable = await RestaurantTable.findOne({
    tableNumber: tableNumber.trim()
  });

  if (existingTable) {
    const error = new Error("Restaurant table already exists");
    error.statusCode = 409;
    throw error;
  }

  const table = await RestaurantTable.create({
    tableNumber: tableNumber.trim(),
    publicToken: generatePublicToken(),
    capacity,
    status: "AVAILABLE",
    isActive: true
  });

  return table;
};

export const getActiveTableByToken = async (publicToken) => {
  const table = await RestaurantTable.findOne({
    publicToken,
    isActive: true,
    status: { $ne: "OUT_OF_SERVICE" }
  }).lean();

  if (!table) {
    const error = new Error("Restaurant table not found");
    error.statusCode = 404;
    throw error;
  }

  return table;
};

export const getRestaurantTables = async () => {
  return RestaurantTable.find()
    .sort({ tableNumber: 1 })
    .lean();
};