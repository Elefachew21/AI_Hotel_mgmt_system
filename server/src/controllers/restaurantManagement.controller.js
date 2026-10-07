import {
  createRestaurantTable,
  getRestaurantTables,
  updateRestaurantTable
} from "../services/restaurantTable.service.js";

import {
  createMenuItem,
  getAllMenuItems,
  updateMenuItem,
  setMenuItemAvailability
} from "../services/menuItem.service.js";

export const createTable = async (
  req,
  res,
  next
) => {
  try {
    const table = await createRestaurantTable(
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Restaurant table created successfully",
      data: { table }
    });
  } catch (error) {
    next(error);
  }
};

export const getTables = async (
  req,
  res,
  next
) => {
  try {
    const tables = await getRestaurantTables();

    return res.status(200).json({
      success: true,
      data: { tables }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTable = async (
  req,
  res,
  next
) => {
  try {
    const table = await updateRestaurantTable(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Restaurant table updated successfully",
      data: { table }
    });
  } catch (error) {
    next(error);
  }
};

export const createMenu = async (
  req,
  res,
  next
) => {
  try {
    const menuItem = await createMenuItem(
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      data: { menuItem }
    });
  } catch (error) {
    next(error);
  }
};

export const getMenus = async (
  req,
  res,
  next
) => {
  try {
    const menuItems = await getAllMenuItems();

    return res.status(200).json({
      success: true,
      data: { menuItems }
    });
  } catch (error) {
    next(error);
  }
};

export const updateMenu = async (
  req,
  res,
  next
) => {
  try {
    const menuItem = await updateMenuItem(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      data: { menuItem }
    });
  } catch (error) {
    next(error);
  }
};

export const updateAvailability = async (
  req,
  res,
  next
) => {
  try {
    const menuItem =
      await setMenuItemAvailability(
        req.params.id,
        req.body.isAvailable
      );

    return res.status(200).json({
      success: true,
      message: "Menu item availability updated",
      data: { menuItem }
    });
  } catch (error) {
    next(error);
  }
};