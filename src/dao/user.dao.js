import userModel from '../models/user.model.js'

export async function findOneUser(query) {
    return await userModel.findOne(query)
}
export async function createUser(data) {
    return await userModel.create(data)
}

export const findUserById = async (id) => {
    return await userModel.findById(id);
};

export const findEmployeeByUserId = async (userId) => {
    return await Employee.findOne({ user: userId }).populate('user', 'username email role');
};

export const findUsers = async (filter = {}) => {
    return await userModel.find(filter).select('-password -refreshToken');
};