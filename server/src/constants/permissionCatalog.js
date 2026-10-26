const permissionCatalog = [
  // Users
  {
    key: "users:create-staff",
    name: "Create Staff User",
    module: "Users",
    description: "Create a staff account.",
  },
  {
    key: "users:read",
    name: "View Users",
    module: "Users",
    description: "View user records.",
  },

  {
    key: "users:update",
    name: "Update Staff Profile",
    module: "Users",
    description: "Update permitted staff profile fields.",
  },
  {
    key: "users:change-role",
    name: "Change Staff Role",
    module: "Users",
    description:
      "Change a staff member's assigned role within the actor's authority.",
  },
  {
    key: "users:change-status",
    name: "Change Staff Status",
    module: "Users",
    description: "Activate, deactivate, or suspend staff accounts.",
  },

  // Customers
  {
    key: "customers:create",
    name: "Create Customer",
    module: "Customers",
    description: "Create a customer record.",
  },
  {
    key: "customers:read",
    name: "View Customers",
    module: "Customers",
    description: "List and view customer records.",
  },
  {
    key: "customers:update",
    name: "Update Customer",
    module: "Customers",
    description: "Update a customer record.",
  },

  // Rooms
  {
    key: "rooms:create",
    name: "Create Room",
    module: "Rooms",
    description: "Create a room record.",
  },
  {
    key: "rooms:read",
    name: "View Rooms",
    module: "Rooms",
    description: "List and view room records.",
  },
  {
    key: "rooms:update",
    name: "Update Room",
    module: "Rooms",
    description: "Update room details.",
  },
  {
    key: "rooms:update-status",
    name: "Update Room Status",
    module: "Rooms",
    description: "Change a room's operational status.",
  },
  {
    key: "rooms:assign-housekeeper",
    name: "Assign Housekeeper",
    module: "Rooms",
    description: "Assign a housekeeper to a room.",
  },

  // Reservations
  {
    key: "reservations:create",
    name: "Create Reservation",
    module: "Reservations",
    description: "Create a reservation.",
  },
  {
    key: "reservations:confirm",
    name: "Confirm Reservation",
    module: "Reservations",
    description: "Confirm a reservation.",
  },
  {
    key: "reservations:check-in",
    name: "Check In Guest",
    module: "Reservations",
    description: "Check a guest into a reservation.",
  },
  {
    key: "reservations:check-out",
    name: "Check Out Guest",
    module: "Reservations",
    description: "Check a guest out of a reservation.",
  },

  // Payments and folios
  {
    key: "payments:create",
    name: "Record Payment",
    module: "Payments",
    description: "Record a payment against a folio.",
  },
  {
    key: "folios:read",
    name: "View Folio",
    module: "Folios",
    description: "View a reservation's folio and totals.",
  },
  {
    key: "folios:close",
    name: "Close Folio",
    module: "Folios",
    description: "Close a folio when business rules permit.",
  },

  // Restaurant tables
  {
    key: "restaurant-tables:create",
    name: "Create Restaurant Table",
    module: "Restaurant",
    description: "Create a restaurant table.",
  },
  {
    key: "restaurant-tables:read",
    name: "View Restaurant Tables",
    module: "Restaurant",
    description: "List restaurant tables.",
  },
  {
    key: "restaurant-tables:update",
    name: "Update Restaurant Table",
    module: "Restaurant",
    description: "Update restaurant table details.",
  },

  // Menu items
  {
    key: "menu-items:create",
    name: "Create Menu Item",
    module: "Restaurant",
    description: "Create a menu item.",
  },
  {
    key: "menu-items:read",
    name: "View Menu Items",
    module: "Restaurant",
    description: "List menu items.",
  },
  {
    key: "menu-items:update",
    name: "Update Menu Item",
    module: "Restaurant",
    description: "Update menu item details.",
  },
  {
    key: "menu-items:update-availability",
    name: "Update Menu Availability",
    module: "Restaurant",
    description: "Change menu item availability.",
  },

  // Kitchen order tickets
  {
    key: "kots:create",
    name: "Create Kitchen Ticket",
    module: "Kitchen",
    description: "Create a kitchen order ticket.",
  },
  {
    key: "kots:read",
    name: "View Kitchen Tickets",
    module: "Kitchen",
    description: "List and view kitchen order tickets.",
  },
  {
    key: "kots:start-cooking",
    name: "Start Cooking",
    module: "Kitchen",
    description: "Move a kitchen ticket into cooking.",
  },
  {
    key: "kots:mark-ready",
    name: "Mark Order Ready",
    module: "Kitchen",
    description: "Mark a kitchen ticket as ready.",
  },
  {
    key: "kots:cancel",
    name: "Cancel Kitchen Ticket",
    module: "Kitchen",
    description: "Cancel a kitchen order ticket.",
  },

  // Housekeeping
  {
    key: "housekeeping:start-task",
    name: "Start Housekeeping Task",
    module: "Housekeeping",
    description: "Start a housekeeping task.",
  },
  {
    key: "housekeeping:complete-task",
    name: "Complete Housekeeping Task",
    module: "Housekeeping",
    description: "Complete a housekeeping task.",
  },

  // Role management
  {
    key: "roles:create",
    name: "Create Custom Role",
    module: "Roles",
    description: "Create a custom role within the actor's authority.",
  },
  {
    key: "roles:read",
    name: "View Roles",
    module: "Roles",
    description: "View role definitions and their assigned permissions.",
  },
  {
    key: "roles:update",
    name: "Update Custom Role",
    module: "Roles",
    description: "Update custom role details within the actor's authority.",
  },
  {
    key: "roles:manage-permissions",
    name: "Manage Role Permissions",
    module: "Roles",
    description: "Assign permitted permissions to a custom role.",
  },
];
export default permissionCatalog;
