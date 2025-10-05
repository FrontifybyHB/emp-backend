import Employee from '../models/employee.model.js';
import User from '../models/user.model.js';

export const createEmployee = async (employeeData) => {
    try {
        // Verify user exists and is not already an employee
        const userExists = await User.findById(employeeData.user);
        if (!userExists) {
            throw new Error('User not found');
        }

        const existingEmployee = await Employee.findOne({ user: employeeData.user });
        if (existingEmployee) {
            throw new Error('User is already an employee');
        }

        return await Employee.create(employeeData);
    } catch (error) {
        throw new Error(`Error creating employee: ${error.message}`);
    }
};

export const findEmployees = async (filter = {}, options = {}) => {
    try {
        const {
            page = 1,
            limit = 10,
            sort = { createdAt: -1 },
            select = null,
            populate = true
        } = options;

        const skip = (page - 1) * limit;

        let query = Employee.find(filter);

        if (populate) {
            query = query.populate('user', 'username email role -_id');
        }

        if (select) {
            query = query.select(select);
        }

        const employees = await query
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Employee.countDocuments(filter);

        return {
            employees,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        };
    } catch (error) {
        throw new Error(`Error fetching employees: ${error.message}`);
    }
};

export const findEmployeeById = async (id, options = {}) => {
    try {
        const { populate = true, select = null } = options;

        let query = Employee.findById(id);

        if (populate) {
            query = query.populate('user', 'username email role');
        }

        if (select) {
            query = query.select(select);
        }

        const employee = await query.lean();

        if (!employee) {
            throw new Error('Employee not found');
        }

        return employee;
    } catch (error) {
        throw new Error(`Error fetching employee: ${error.message}`);
    }
};

export const findEmployeeByUserId = async (userId, options = {}) => {
    try {
        const { populate = true, select = null } = options;

        let query = Employee.findOne({ user: userId });

        if (populate) {
            query = query.populate('user', 'username email role');
        }

        if (select) {
            query = query.select(select);
        }

        return await query.lean();
    } catch (error) {
        throw new Error(`Error fetching employee by user ID: ${error.message}`);
    }
};

export const updateEmployee = async (id, updateData, options = {}) => {
    try {
        const { populate = true } = options;

        // Prevent updating user reference
        delete updateData.user;

        let query = Employee.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (populate) {
            query = query.populate('user', 'username email role');
        }

        const employee = await query;

        if (!employee) {
            throw new Error('Employee not found');
        }

        return employee;
    } catch (error) {
        throw new Error(`Error updating employee: ${error.message}`);
    }
};

export const deleteEmployee = async (id) => {
    try {
        const employee = await Employee.findByIdAndDelete(id);

        if (!employee) {
            throw new Error('Employee not found');
        }

        return employee;
    } catch (error) {
        throw new Error(`Error deleting employee: ${error.message}`);
    }
};

export const countEmployees = async (filter = {}) => {
    try {
        return await Employee.countDocuments(filter);
    } catch (error) {
        throw new Error(`Error counting employees: ${error.message}`);
    }
};

export const findEmployeesByDepartment = async (department, options = {}) => {
    try {
        return await findEmployees({ department }, options);
    } catch (error) {
        throw new Error(`Error fetching employees by department: ${error.message}`);
    }
};

export const findEmployeesByRole = async (role, options = {}) => {
    try {
        return await findEmployees({ role }, options);
    } catch (error) {
        throw new Error(`Error fetching employees by role: ${error.message}`);
    }
};