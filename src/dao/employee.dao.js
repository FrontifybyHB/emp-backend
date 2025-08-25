import Employee from '../models/employee.model.js';

export const createEmployee = async (employeeData) => {
    return await Employee.create(employeeData);
};

export const findEmployees = async (filter = {}, options = {}) => {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;
    
    return await Employee.find(filter)
        .populate('user', 'username email role')
        .sort(sort)
        .skip(skip)
        .limit(limit);
};

export const findEmployeeById = async (id) => {
    return await Employee.findById(id).populate('user', 'username email role');
};

export const updateEmployee = async (id, updateData) => {
    return await Employee.findByIdAndUpdate(id, updateData, { new: true })
        .populate('user', 'username email role');
};

export const deleteEmployee = async (id) => {
    return await Employee.findByIdAndDelete(id);
};

export const countEmployees = async (filter = {}) => {
    return await Employee.countDocuments(filter);
};

export const findUsers = async (filter = {}) => {
    return await userModel.find(filter).select('-password -refreshToken');
};