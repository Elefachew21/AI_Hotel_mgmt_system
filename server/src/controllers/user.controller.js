import {
  getUsers,
  getUserById,
  createStaff,
  updateStaff,
} from "../services/user.service.js";

const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 25 } = req.query;
    const result = await getUsers({ page, limit });
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createStaffUser = async (req, res, next) => {
  try {
    const user = await createStaff({
      username: req.body.username,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      roleId: req.body.roleId,

      // Set by authenticate middleware, not supplied by the client.
      actorId: req.user.id,
      requestId: req.id ?? null,
    });

    return res.status(201).json({
      success: true,
      message: "Staff account created successfully",
      data: {
        user: {
          id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          roleRef: user.roleRef,
          status: user.status,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

const updateStaffUser = async (req, res, next) => {
  try {
    const user = await updateStaff({
      userId: req.params.id,
      actorId: req.user.id,
      updates: req.body,
      requestId: req.id ?? null,
    });

    return res.status(200).json({
      success: true,
      message: "Staff account updated successfully",
      data: {
        user: {
          id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          roleRef: user.roleRef,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export { getUser, listUsers, createStaffUser, updateStaffUser };
