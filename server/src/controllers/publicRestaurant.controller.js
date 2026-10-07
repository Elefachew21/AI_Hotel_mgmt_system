import {
  getActiveTableByToken
} from "../services/restaurantTable.service.js";

import {
  getAvailableMenuItems
} from "../services/menuItem.service.js";

import {
  createOrderSession
} from "../services/orderSession.service.js";

import {
  createFoodOrder
} from "../services/foodOrder.service.js";

export const getPublicTable = async (req, res, next) => {
  try {
    const table = await getActiveTableByToken(req.params.token);

    return res.status(200).json({
      success: true,
      data: {
        table: {
          id: table._id,
          tableNumber: table.tableNumber,
          capacity: table.capacity
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicMenu = async (req, res, next) => {
  try {
    const menuItems = await getAvailableMenuItems();

    return res.status(200).json({
      success: true,
      data: {
        menuItems
      }
    });
  } catch (error) {
    next(error);
  }
};

export const startOrderSession = async (req, res, next) => {
  try {
    const result = await createOrderSession(
      req.body.tableToken
    );

    return res.status(201).json({
      success: true,
      message: "Order session created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const submitFoodOrder = async (req, res, next) => {
  try {
    const order = await createFoodOrder(req.body);

    return res.status(201).json({
      success: true,
      message: "Food order submitted successfully",
      data: {
        order
      }
    });
  } catch (error) {
    next(error);
  }
};