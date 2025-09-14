import User from '../models/user.model.js';

export const findOneUser = async (query, options = {}) => {
    try {
        return await User.findOne(query, null, options);
    } catch (error) {
        throw new Error(`Error finding user: ${error.message}`);
    }
};

export const createUser = async (userData) => {
    try {
        const user = new User(userData);
        return await user.save();
    } catch (error) {
        if (error.code === 11000) {
            throw new Error('User already exists');
        }
        throw new Error(`Error creating user: ${error.message}`);
    }
};

export const findUserById = async (id, selectFields = null) => {
    try {
        return await User.findById(id, selectFields);
    } catch (error) {
        throw new Error(`Error finding user by ID: ${error.message}`);
    }
};

export const updateUser = async (id, updateData) => {
    try {
        return await User.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        );
    } catch (error) {
        throw new Error(`Error updating user: ${error.message}`);
    }
};

export const findUsers = async (filter = {}, options = {}) => {
    try {
        const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
        const skip = (page - 1) * limit;
        
        return await User.find(filter)
            .select('-password -refreshToken')
            .sort(sort)
            .skip(skip)
            .limit(limit);
    } catch (error) {
        throw new Error(`Error finding users: ${error.message}`);
    }
};

export const getAllUsers = async (options = {}) => {
    try {
        const { page = 1, limit = 10, sort = { createdAt: -1 }, role } = options;
        const skip = (page - 1) * limit;
        
        const filter = {};
        if (role) filter.role = role;
        
        const users = await User.find(filter)
            .select('-password -refreshToken')
            .sort(sort)
            .skip(skip)
            .limit(limit);
            
        const total = await User.countDocuments(filter);
        
        return {
            users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        };
    } catch (error) {
        throw new Error(`Error fetching users: ${error.message}`);
    }
};