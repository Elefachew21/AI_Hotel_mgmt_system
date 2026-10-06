import MenuItem from "../models/MenuItem.js";

export const getAvailableMenuItems = async () => {
  return MenuItem.find({
    isActive: true,
    isAvailable: true
  })
    .sort({ category: 1, name: 1 })
    .lean();
};

export const getMenuItemById = async (menuItemId) => {
  const menuItem = await MenuItem.findOne({
    _id: menuItemId,
    isActive: true,
    isAvailable: true
  }).lean();

  if (!menuItem) {
    const error = new Error("Menu item is unavailable");
    error.statusCode = 404;
    throw error;
  }

  return menuItem;
};