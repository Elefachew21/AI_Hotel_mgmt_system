import KitchenOrderTicket from "../models/KitchenOrderTicket.js";
import FoodOrder from "../models/FoodOrder.js";
import { generateKotNumber } from "./sequence.service.js";
import FoodOrderItem from "../models/FoodOrderItem.js"; 
import { emitKotCancelled,emitKotReady,emitKotStarted } from "../realtime/kitchen.events.js";
const invalidTransition = (from, to) => {
  const error = new Error(
    `Invalid KOT status transition from ${from} to ${to}`
  );

  error.statusCode = 409;

  return error;
};

export const createKitchenOrderTicket = async ({
  foodOrderId,
  dbSession = null
}) => {
  const foodOrder = await FoodOrder.findById(foodOrderId)
    .session(dbSession);

  if (!foodOrder) {
    const error = new Error("Food order not found");
    error.statusCode = 404;
    throw error;
  }

  if (foodOrder.status === "CANCELLED") {
    const error = new Error(
      "Cannot create KOT for a cancelled food order"
    );

    error.statusCode = 409;
    throw error;
  }

  const existingKot = await KitchenOrderTicket.findOne({
    foodOrder: foodOrder._id
  }).session(dbSession);

  if (existingKot) {
    const error = new Error(
      "Kitchen order ticket already exists for this food order"
    );

    error.statusCode = 409;
    throw error;
  }

  const kotNumber = await generateKotNumber(dbSession);

  const [kot] = await KitchenOrderTicket.create(
    [
      {
        kotNumber,
        foodOrder: foodOrder._id,
        table: foodOrder.table,
        status: "PENDING"
      }
    ],
    {
      session: dbSession
    }
  );

  return kot;
};

export const getKitchenOrderTickets = async ({
  status = null
} = {}) => {
  const filter = {};

  if (status) {
    filter.status = status;
  }

  return KitchenOrderTicket.find(filter)
    .populate(
      "foodOrder",
      "orderNumber totalAmount customerNotes"
    )
    .populate("table", "tableNumber")
    .sort({ createdAt: 1 })
    .lean();
};

export const getKitchenOrderTicketById = async (kotId) => {
  const kot = await KitchenOrderTicket.findById(kotId)
    .populate("foodOrder", "orderNumber totalAmount customerNotes")
    .populate("table", "tableNumber")
    .lean();

  if (!kot) {
    const error = new Error("Kitchen order ticket not found");
    error.statusCode = 404;
    throw error;
  }

  const items = await FoodOrderItem.find({
    order: kot.foodOrder._id
  }).lean();

  return {
    ...kot,
    items
  };
};
const transitionKotStatus = async ({
  kotId,
  nextStatus,
  userId
}) => {
  const kot = await KitchenOrderTicket.findById(kotId);

  if (!kot) {
    const error = new Error("Kitchen order ticket not found");
    error.statusCode = 404;
    throw error;
  }

  const currentStatus = kot.status;

  const allowedTransitions = {
    PENDING: ["COOKING", "CANCELLED"],
    COOKING: ["READY", "CANCELLED"],
    READY: [],
    CANCELLED: []
  };

  if (!allowedTransitions[currentStatus].includes(nextStatus)) {
    throw invalidTransition(currentStatus, nextStatus);
  }

  kot.status = nextStatus;

  if (nextStatus === "COOKING") {
    kot.startedAt = new Date();
    kot.startedBy = userId;
  }

  if (nextStatus === "READY") {
    kot.readyAt = new Date();
    kot.completedBy = userId;
  }

  if (nextStatus === "CANCELLED") {
    kot.cancelledAt = new Date();
  }

  await kot.save();
const updatedKot =
  await getKitchenOrderTicketById(kot._id);

if (nextStatus === "COOKING") {
  emitKotStarted(updatedKot);
}

if (nextStatus === "READY") {
  emitKotReady(updatedKot);
}

if (nextStatus === "CANCELLED") {
  emitKotCancelled(updatedKot);
}
  return kot;
};
export const startCooking = async (kotId, userId) => {
  return transitionKotStatus({
    kotId,
    nextStatus: "COOKING",
    userId
  });
};

export const markKotReady = async (kotId, userId) => {
  return transitionKotStatus({
    kotId,
    nextStatus: "READY",
    userId
  });
};


export const cancelKot = async (kotId, userId) => {
  return transitionKotStatus({
    kotId,
    nextStatus: "CANCELLED",
    userId
  });
    
   

};

