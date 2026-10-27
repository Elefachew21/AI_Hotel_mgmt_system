import { verifyAccessToken } from "../services/token.service.js";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Permission from "../models/Permission.js";
export const authenticate = async (req, res, next) => {
  let payload;
  // 1. Verify the bearer token.
  try {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const parts = authorization.trim().split(/\s+/);

    if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication format",
      });
    }

    payload = verifyAccessToken(parts[1]);

    if (!payload?.sub) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
      });
    }
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  // 2. Load the current account and its database-backed role.
  try {
    const user = await User.findById(payload.sub)
      .select("role roleRef status tokenVersion")
      .populate({
        path: "roleRef",
        select: "name permissions isActive",
        populate: {
          path: "permissions",
          select: "key isActive",
        },
      });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }
    // Reject tokens issued under an older password/session version.
    if (
      !Number.isInteger(payload.tokenVersion) ||
      payload.tokenVersion !== (user.tokenVersion ?? 0)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please log in again.",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      roleRef: user.roleRef
        ? {
            id: user.roleRef._id.toString(),
            name: user.roleRef.name,
            isActive: user.roleRef.isActive,
            permissions: user.roleRef.permissions.map((permission) => ({
              key: permission.key,
              isActive: permission.isActive,
            })),
          }
        : null,
    };

    return next();
  } catch (error) {
    // Let centralized error handling handle database/server failures.
    return next(error);
  }
};
