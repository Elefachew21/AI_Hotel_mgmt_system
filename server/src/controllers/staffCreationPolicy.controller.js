import {
  saveStaffCreationPolicy,
  listStaffCreationPolicies,
} from "../services/staffCreationPolicy.service.js";

const savePolicy = async (req, res, next) => {
  try {
    const policy = await saveStaffCreationPolicy({
      actorId: req.user.id,
      actorRoleId: req.body.actorRoleId,
      allowedTargetRoleIds: req.body.allowedTargetRoleIds,
      allowAllActiveRoles: req.body.allowAllActiveRoles,
      isActive: req.body.isActive,
    });

    return res.status(200).json({
      success: true,
      message: "Staff-creation policy saved successfully",
      data: { policy },
    });
  } catch (error) {
    return next(error);
  }
};

const listPolicies = async (req, res, next) => {
  try {
    const policies = await listStaffCreationPolicies(req.user.id);

    return res.status(200).json({
      success: true,
      data: { policies },
    });
  } catch (error) {
    return next(error);
  }
};

export { savePolicy, listPolicies };
