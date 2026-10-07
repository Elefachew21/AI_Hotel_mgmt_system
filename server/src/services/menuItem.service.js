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

export const createMenuItem = async ({
  name,
  description,
  category,
  price,
  imageUrl
}) => {
  const menuItem = await MenuItem.create({
    name: name.trim(),
    description: description?.trim() || null,
    category: category.trim(),
    price,
    imageUrl: imageUrl?.trim() || null,
    isAvailable: true,
    isActive: true
  });

  return menuItem;
};

export const getAllMenuItems = async () => {
  return MenuItem.find()
    .sort({ category: 1, name: 1 })
    .lean();
};

export const updateMenuItem = async (
  menuItemId,
  updates
) => {
  const menuItem = await MenuItem.findById(menuItemId);

  if (!menuItem) {
    const error = new Error("Menu item not found");
    error.statusCode = 404;
    throw error;
  }

  const allowedFields = [
    "name",
    "description",
    "category",
    "price",
    "imageUrl",
    "isAvailable",
    "isActive"
  ];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      menuItem[field] =
        typeof updates[field] === "string"
          ? updates[field].trim()
          : updates[field];
    }
  }

  await menuItem.save();

  return menuItem;
};

export const setMenuItemAvailability = async (
  menuItemId,
  isAvailable
) => {
  const menuItem = await MenuItem.findByIdAndUpdate(
    menuItemId,
    {
      $set: {
        isAvailable
      }
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!menuItem) {
    const error = new Error("Menu item not found");
    error.statusCode = 404;
    throw error;
  }

  return menuItem;
};