export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

export const authorizePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    if (
      typeof requiredPermission !== "string" ||
      requiredPermission.trim() === ""
    ) {
      return res.status(500).json({
        success: false,
        message: "Authorization is not configured correctly",
      });
    }

    const role = req.user.roleRef;

    if (!role || role.isActive !== true || !Array.isArray(role.permissions)) {
      return res.status(403).json({
        success: false,
        message: "No active role is assigned to this account",
      });
    }

    const hasPermission = role.permissions.some(
      (permission) =>
        permission &&
        permission.key === requiredPermission &&
        permission.isActive === true,
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    return next();
  };
};
