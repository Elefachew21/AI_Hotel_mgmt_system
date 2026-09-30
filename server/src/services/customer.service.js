import Customer from "../models/Customer.js";
const createCustomer = async (data) => {
    return Customer.create(data);

}
const getCustomers = async () => {
    return Customer.find()
    .sort({createdAt:-1})
}
const getCustomerById = async (customerId) => {
    return Customer.findById(customerId);
};
const updateCustomer = async (customerId, data) => {
    return Customer.findByIdAndUpdate(
        customerId,
        data,
        {
            new: true,
            runValidators: true

        }
    );

};

export {createCustomer,getCustomers,getCustomerById,updateCustomer}