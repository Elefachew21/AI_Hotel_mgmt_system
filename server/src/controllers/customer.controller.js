import { createCustomer, getCustomers, getCustomerById, updateCustomer } from "../services/customer.service.js";
const create = async (req, res, next) => {
    try {
       const customer = await createCustomer(req.body);
        res.status(201).json({
            success: true,
            message: "Customer Created Successfully !!!",
            data: {
                customer
            }
        });
    }
    catch (error) {
        next(error);
    }
}

const list = async (req, res, next) => {
    try {
        const customers = await getCustomers();
        res.status(200).json({
            success: true,
            data: {
                customers
            }
        })
    } catch (error) {
        next(error);
    }
};

const getOne = async (req, res, next) => {
    try {
        const customer = await getCustomerById(req.params.id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not Found"
            });
        }
        res.status(200).json({
            success: true,
            data: {
                customer
            }
        })
    } catch (error) {
        next(error);
    }

}
const update = async (req, res, next) => {
    try {
        const customer = await updateCustomer(req.params.id, req.body);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message:"Customer not Found"
            })
        }
        res.status(200).json({
            success: true,
            message: "Customer Updated Successfully !!!",
            data: {
                customer
            }
        })
    } catch (error) {
        next(error);
    }
}

export {list,create,getOne,update}