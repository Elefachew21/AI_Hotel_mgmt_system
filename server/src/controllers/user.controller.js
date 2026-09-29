import {
    getUsers,
    getUserById,
    createStaff
} from "../services/user.service.js";

 const listUsers = async (req, res, next) => {
    try {
        const users = await getUsers();

        res.status(200).json({
            success: true,
            data: {
                users
            }
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
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user
            }
        });
    } catch (error) {
        next(error);
    }
};
const createStaffUser = async (req, res, next) => {
    try {
        const user = await createStaff(req.body);
        res.status(201).json({
            success: true,
            message: "staff account Created Successfully !!!",
            data: {
                user: {
                     id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    status: user.status,
                    createdAt: user.createdAt
                }
            }
        })
    }
    catch (error) {
        next(error);
    }
}
export { getUser, listUsers,createStaffUser };