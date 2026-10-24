import dotenv from "dotenv";

import connectDB from "../config/database.js";
import Permission from "../models/Permission.js";
import Role from "../models/Role.js";
import permissionCatalog from "../constants/permissionCatalog.js";
dotenv.config();
// These assignments preserve the access patterns found in
// the current routes. They are not new authorization rules.
const builtInRoles = [
  {
    name: "SUPER_ADMIN",
    displayName: "Super Administrator",
    description: "Manages the hotel's system and administrative operations.",
    permissions: "ALL",
    isDeactivationProtected: true,
  },
  {
    name: "MANAGER",
    displayName: "Manager",
    description: "Manages hotel operations within assigned authority.",
    permissions: [
      "users:read",
      "reservations:create",
      "reservations:confirm",
      "reservations:check-in",
      "reservations:check-out",
      "customers:create",
      "customers:read",
      "customers:update",
      "rooms:create",
      "rooms:read",
      "rooms:update",
      "rooms:update-status",
      "rooms:assign-housekeeper",
      "payments:create",
      "folios:read",
      "folios:close",
      "restaurant-tables:create",
      "restaurant-tables:read",
      "restaurant-tables:update",
      "menu-items:create",
      "menu-items:read",
      "menu-items:update",
      "menu-items:update-availability",
      "kots:create",
      "kots:read",
      "kots:start-cooking",
      "kots:mark-ready",
      "kots:cancel",
      "housekeeping:start-task",
      "housekeeping:complete-task",

      "roles:create",
      "roles:read",
      "roles:update",
      "roles:manage-permissions",
    ],
    isDeactivationProtected: true,
  },
  {
    name: "RECEPTIONIST",
    displayName: "Receptionist",
    description: "Handles front-desk reservations and customer operations.",
    permissions: [
      "reservations:create",
      "reservations:confirm",
      "reservations:check-in",
      "reservations:check-out",
      "customers:create",
      "customers:read",
      "customers:update",
      "rooms:read",
      "payments:create",
      "folios:read",
    ],
  },
  {
    name: "CASHIER",
    displayName: "Cashier",
    description: "Handles payments and folio operations.",
    permissions: ["payments:create", "folios:read", "folios:close"],
  },
  {
    name: "KITCHEN_STAFF",
    displayName: "Kitchen Staff",
    description: "Processes kitchen order tickets.",
    permissions: [
      "kots:create",
      "kots:read",
      "kots:start-cooking",
      "kots:mark-ready",
      "kots:cancel",
    ],
  },
  {
    name: "INVENTORY_OFFICER",
    displayName: "Inventory Officer",
    description: "Responsible for inventory operations.",
    permissions: [],
  },
  {
    name: "HOUSEKEEPER",
    displayName: "Housekeeper",
    description: "Performs assigned housekeeping tasks.",
    permissions: ["housekeeping:start-task", "housekeeping:complete-task"],
  },
  {
    name: "MAINTENANCE_TECH",
    displayName: "Maintenance Technician",
    description: "Responsible for maintenance operations.",
    permissions: [],
  },
  {
    name: "GUEST",
    displayName: "Guest",
    description: "Registered guest account.",
    permissions: [],
  },
];

const seedRolesAndPermissions = async () => {
  try {
    await connectDB();

    // 1. Seed the canonical permission definitions.
    for (const definition of permissionCatalog) {
      await Permission.updateOne(
        { key: definition.key },
        {
          $set: {
            name: definition.name,
            module: definition.module,
            description: definition.description,
            isSystemPermission: true,
          },
          $setOnInsert: {
            isActive: true,
          },
        },
        { upsert: true, runValidators: true },
      );
    }

    console.log(
      `Permission definitions processed: ${permissionCatalog.length}`,
    );

    // 2. Load permissions once and create a key-to-ID lookup.
    const permissions = await Permission.find({
      key: { $in: permissionCatalog.map((item) => item.key) },
      isActive: true,
    }).select("_id key");

    const permissionIdByKey = new Map(
      permissions.map((permission) => [permission.key, permission._id]),
    );

    // 3. Fail rather than silently seed incomplete role assignments.
    for (const role of builtInRoles) {
      if (role.permissions === "ALL") {
        continue;
      }

      for (const key of role.permissions) {
        if (!permissionIdByKey.has(key)) {
          throw new Error(
            `Permission "${key}" is missing or inactive. ` +
              `Cannot seed role "${role.name}".`,
          );
        }
      }
    }

    // 4. Create/update built-in roles.
    for (const role of builtInRoles) {
      const permissionIds =
        role.permissions === "ALL"
          ? permissions.map((permission) => permission._id)
          : role.permissions.map((key) => permissionIdByKey.get(key));

      await Role.updateOne(
        { name: role.name },
        {
          $set: {
            displayName: role.displayName,
            description: role.description,
            permissions: permissionIds,
            isSystemRole: true,

            isDeactivationProtected: role.isDeactivationProtected ?? false,
          },
          $setOnInsert: {
            isActive: true,
            createdBy: null,
          },
        },
        { upsert: true, runValidators: true },
      );
    }

    console.log(`Built-in roles processed: ${builtInRoles.length}`);
    console.log("Role and permission seeding completed.");
  } catch (error) {
    console.error("Role and permission seeding failed:", error);
    process.exitCode = 1;
  } finally {
    const mongoose = (await import("mongoose")).default;
    await mongoose.disconnect();
  }
};

seedRolesAndPermissions();
