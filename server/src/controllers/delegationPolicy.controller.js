import { saveDelegationPolicy } from "../services/delegationPolicy.service.js";

const saveDelegationPolicyController = async (req, res, next) => {
  try {
    const actorId = req.user.id || req.user._id;

    const policy = await saveDelegationPolicy({
      actorId,
      actorRoleId: req.body.actorRoleId,
      delegablePermissionIds: req.body.delegablePermissionIds,
      isActive: req.body.isActive,
    });

    return res.status(200).json({
      message: "Delegation policy saved successfully",
      data: policy,
    });
  } catch (error) {
    next(error);
  }
};

export { saveDelegationPolicyController };
