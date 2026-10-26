import {
  createRole,
  updateRolePermissions,
  listRoles,
  getRoleById,
  updateRoleStatus,
} from "../services/role.service.js";

const createRoleController = async (req, res, next) => {
  try {
    const actorId = req.user.id || req.user._id;

    const role = await createRole({
      actorId,
      name: req.body.name,
      displayName: req.body.displayName,
      description: req.body.description,
      permissionIds: req.body.permissionIds ?? [],
    });

    return res.status(201).json({
      message: "Role created successfully",
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

const updateRolePermissionsController = async (req, res, next) => {
  try {
    const actorId = req.user.id || req.user._id;

    const role = await updateRolePermissions({
      actorId,
      roleId: req.params.id,
      permissionIds: req.body.permissionIds,
      requestId: req.id ?? null,
    });

    return res.status(200).json({
      message: "Role permissions updated successfully",
      data: role,
    });
  } catch (error) {
    next(error);
  }
};
const listRolesController = async (req, res, next) => {
  try {
    const roles = await listRoles({ actorId: req.user.id || req.user._id });
    return res.status(200).json({ count: roles.length, data: roles });
  } catch (error) {
    next(error);
  }
};
const getRoleController = async (req, res, next) => {
  try {
    const role = await getRoleById({
      actorId: req.user.id || req.user._id,
      roleId: req.params.id,
    });

    return res.status(200).json({
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

const updateRoleStatusController = async (req, res, next) => {
  try {
    const role = await updateRoleStatus({
      actorId: req.user.id || req.user._id,
      roleId: req.params.id,
      isActive: req.body.isActive,
    });

    return res.status(200).json({
      message: role.isActive
        ? "Role activated successfully"
        : "Role deactivated successfully",
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

export {
  createRoleController,
  updateRolePermissionsController,
  listRolesController,
  getRoleController,
  updateRoleStatusController,
};
