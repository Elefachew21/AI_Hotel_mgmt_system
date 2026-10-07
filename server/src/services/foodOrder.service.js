import mongoose from "mongoose";
import FoodOrder from "../models/FoodOrder.js";
import FoodOrderItem from "../models/FoodOrderItem.js";
import OrderSession from "../models/OrderSession.js";
import MenuItem from "../models/MenuItem.js";
import { generateOrderNumber } from "./sequence.service.js";
import {createKitchenOrderTicket} from "./kitchenOrderTicket.service.js";

export const createFoodOrder = async ({
  sessionToken,
  items,
  customerNotes
}) => {
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error("Order must contain at least one item");
    error.statusCode = 400;
    throw error;
  }

  const orderSession = await OrderSession.findOne({
    sessionToken,
    status: "ACTIVE",
    expiresAt: { $gt: new Date() }
  });

  if (!orderSession ) {
    const error = new Error("Order session is invalid or expired");
    error.statusCode = 401;
    throw error;
  }

  const dbSession = await mongoose.startSession();

  try {
    let createdOrder;

    await dbSession.withTransaction(async () => {
      const menuItemIds = items.map((item) => item.menuItemId);

      const menuItems = await MenuItem.find({
        _id: { $in: menuItemIds },
        isActive: true,
        isAvailable: true
      }).session(dbSession);

      if (menuItems.length !== new Set(menuItemIds).size) {
        const error = new Error(
          "One or more menu items are unavailable"
        );
        error.statusCode = 409;
        throw error;
      }

      const menuMap = new Map(
        menuItems.map((menuItem) => [
          menuItem._id.toString(),
          menuItem
        ])
      );

      const orderNumber = await generateOrderNumber(dbSession);

      let totalAmount = 0;

      const orderItems = items.map((item) => {
        const menuItem = menuMap.get(item.menuItemId);

        if (!menuItem) {
          const error = new Error(
            `Menu item ${item.menuItemId} is unavailable`
          );
          error.statusCode = 409;
          throw error;
        }

        const quantity = Number(item.quantity);

        if (!Number.isInteger(quantity) || quantity < 1) {
          const error = new Error(
            `Invalid quantity for ${menuItem.name}`
          );
          error.statusCode = 400;
          throw error;
        }

        const total = menuItem.price * quantity;

        totalAmount += total;

        return {
          menuItem: menuItem._id,
          name: menuItem.name,
          quantity,
          unitPrice: menuItem.price,
          total,
          notes: item.notes?.trim() || null
        };
      });

      const [order] = await FoodOrder.create(
        [
          {
            orderNumber,
            table: orderSession.table,
            session: orderSession._id,
            status: "PENDING",
            totalAmount,
            customerNotes: customerNotes?.trim() || null
          }
        ],
        { session: dbSession }
      );

      const orderItemsToCreate = orderItems.map((item) => ({
        ...item,
        order: order._id
      }));

      await FoodOrderItem.insertMany(
        orderItemsToCreate,
        { session: dbSession }
      );
     await createKitchenOrderTicket({
    foodOrderId: order._id,
     dbSession
});
      orderSession.status = "COMPLETED";
      await orderSession.save({ session: dbSession });

      createdOrder = order;
    });

    return FoodOrder.findById(createdOrder._id)
      .populate("table", "tableNumber")
      .lean();
  } finally {
    await dbSession.endSession();
  }
};