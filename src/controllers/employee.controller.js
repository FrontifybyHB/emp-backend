import { 
    createEmployee as createEmployeeDAO,
    findEmployees,
    findEmployeeById,
    updateEmployee as updateEmployeeDAO,
    deleteEmployee as deleteEmployeeDAO,
    countEmployees
} from '../dao/employee.dao.js';


// @desc Create new employee
export const createEmployeeController = async (req, res, next) => {
    try {
        
        const employee = await createEmployeeDAO(req.body);
        
        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            data: employee
        });
    } catch (error) {
        next(error);
    }
};

// @desc Get all employees
export const getEmployeesController = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, department, role } = req.query;
        
        const filter = {};
        if (department) filter.department = department;
        if (role) filter.role = role;
        
        const employees = await findEmployees(filter, { page, limit });
        const total = await countEmployees(filter);
        
        res.json({
            success: true,
            data: {
                employees,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc Get employee by ID
export const getEmployeeByIdController = async (req, res, next) => {
    try {
        const employee = await findEmployeeById(req.params.id);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        
        res.json({
            success: true,
            data: employee
        });
    } catch (error) {
        next(error);
    }
};

// @desc Update employee
export const updateEmployeeController = async (req, res, next) => {
    try {
        const employee = await updateEmployeeDAO(req.params.id, req.body);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Employee updated successfully',
            data: employee
        });
    } catch (error) {
        next(error);
    }
};

// @desc Delete employee
export const deleteEmployeeController = async (req, res, next) => {
    try {
        const employee = await deleteEmployeeDAO(req.params.id);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Employee deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

