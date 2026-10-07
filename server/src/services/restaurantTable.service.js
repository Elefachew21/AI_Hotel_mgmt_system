import crypto from "crypto";
import RestaurantTable from "../models/RestaurantTable.js";

const generatePublicToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const createRestaurantTable = async ({
  tableNumber,
  capacity
}) => {
  const normalizedTableNumber = tableNumber.trim();

  const existingTable = await RestaurantTable.findOne({
    tableNumber: normalizedTableNumber
  });

  if (existingTable) {
    const error = new Error(
      "Restaurant table already exists"
    );
    error.statusCode = 409;
    throw error;
  }

  return RestaurantTable.create({
    tableNumber: normalizedTableNumber,
    publicToken: generatePublicToken(),
    capacity,
    status: "AVAILABLE",
    isActive: true
  });
};

export const getActiveTableByToken = async (
  publicToken
) => {
  const table = await RestaurantTable.findOne({
    publicToken,
    isActive: true,
    status: { $ne: "OUT_OF_SERVICE" }
  }).lean();

  if (!table) {
    const error = new Error(
      "Restaurant table not found"
    );
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

export const updateRestaurantTable = async (
  tableId,
  updates
) => {
  const table = await RestaurantTable.findById(
    tableId
  );

  if (!table) {
    const error = new Error(
      "Restaurant table not found"
    );
    error.statusCode = 404;
    throw error;
  }

  if (updates.tableNumber !== undefined) {
    const normalizedTableNumber =
      updates.tableNumber.trim();

    const duplicate = await RestaurantTable.findOne({
      tableNumber: normalizedTableNumber,
      _id: { $ne: tableId }
    });

    if (duplicate) {
      const error = new Error(
        "Restaurant table number already exists"
      );
      error.statusCode = 409;
      throw error;
    }

    table.tableNumber = normalizedTableNumber;
  }

  if (updates.capacity !== undefined) {
    table.capacity = updates.capacity;
  }

  if (updates.status !== undefined) {
    table.status = updates.status;
  }

  if (updates.isActive !== undefined) {
    table.isActive = updates.isActive;
  }

  await table.save();

  return table;
};