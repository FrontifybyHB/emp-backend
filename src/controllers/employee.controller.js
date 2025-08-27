import { 
    createEmployee as createEmployeeDAO,
    findEmployees,
    findEmployeeById,
    findEmployeeByUserId,
    updateEmployee as updateEmployeeDAO,
    deleteEmployee as deleteEmployeeDAO,
    findEmployeesByDepartment,
} from '../dao/employee.dao.js';
import { sanitizeEmployee, sanitizeEmployeeList } from '../utils/sanitizer.js';

export const createEmployeeController = async (req, res, next) => {
    try {
        const employee = await createEmployeeDAO(req.body);
        
        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            data: sanitizeEmployee(employee)
        });
    } catch (error) {
        if (error.message.includes('already an employee') || error.message.includes('not found')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        next(error);
    }
};

export const getEmployeesController = async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            department, 
            role, 
            sort = 'createdAt',
            order = 'desc'
        } = req.query;
        
        // Build filter based on user permissions
        const filter = buildEmployeeFilter(req.user, { department, role });
        
        // Build sort object
        const sortObj = { [sort]: order === 'desc' ? -1 : 1 };
        
        const options = {
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 50), // Max 50 items per page
            sort: sortObj
        };
        
        const result = await findEmployees(filter, options);
        
        res.json({
            success: true,
            message: 'Employees retrieved successfully',
            data: {
                employees: sanitizeEmployeeList(result.employees, req.user),
                pagination: result.pagination
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getEmployeeByIdController = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Check if user can access this employee
        if (!canAccessEmployee(req.user, id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        const employee = await findEmployeeById(id);
        
        res.status(200).json({
            success: true,
            message: 'Employee retrieved successfully',
            data: sanitizeEmployee(employee, req.user)
        });
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        next(error);
    }
};

export const getMyProfileController = async (req, res, next) => {
    try {
        const employee = await findEmployeeByUserId(req.user.id);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee profile not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Profile retrieved successfully',
            data: sanitizeEmployee(employee, req.user)
        });
    } catch (error) {
        next(error);
    }
};

export const updateEmployeeController = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Check permissions
        if (!canModifyEmployee(req.user, id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        // Filter update data based on user role
        const filteredUpdateData = filterUpdateData(req.body, req.user);
        
        const employee = await updateEmployeeDAO(id, filteredUpdateData);
        
        res.status(200).json({
            success: true,
            message: 'Employee updated successfully',
            data: sanitizeEmployee(employee, req.user)
        });
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        next(error);
    }
};

export const deleteEmployeeController = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Only admin can delete employees
        if (!req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        await deleteEmployeeDAO(id);
        
        res.status(200).json({
            success: true,
            message: 'Employee deleted successfully'
        });
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        next(error);
    }
};

export const getEmployeesByDepartmentController = async (req, res, next) => {
    try {
        const { department } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        // Check if user can access department data
        if (!canAccessDepartment(req.user, department)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        const options = {
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 50)
        };
        
        const result = await findEmployeesByDepartment(department, options);
        
        res.status(200).json({
            success: true,
            message: 'Department employees retrieved successfully',
            data: {
                employees: sanitizeEmployeeList(result.employees, req.user),
                pagination: result.pagination
            }
        });
    } catch (error) {
        next(error);
    }
};

// Helper functions for security and permissions
const buildEmployeeFilter = (user, queryParams) => {
    const filter = {};
    
    // Apply query filters
    if (queryParams.department) filter.department = queryParams.department;
    if (queryParams.role) filter.role = queryParams.role;
    
    // Apply role-based restrictions
    if (user.role === 'employee') {
        filter.user = user.id; // Employees can only see themselves
    }
    
    return filter;
};

const canAccessEmployee = (user, employeeId) => {
    // Admin and HR can access all employees
    if (user.isAdmin || user.role === 'admin' || user.role === 'hr') {
        return true;
    }
    
    // Managers can access employees in their department (implement department check)
    if (user.role === 'manager') {
        return true; // Add department-specific logic here
    }
    
    // Employees can only access their own profile
    return false; // Will be handled by getMyProfileController
};

const canModifyEmployee = (user, employeeId) => {
    // Only admin and HR can modify employee records
    return user.isAdmin || user.role === 'admin' || user.role === 'hr';
};

const canAccessDepartment = (user, department) => {
    // Admin and HR can access all departments
    if (user.isAdmin || user.role === 'admin' || user.role === 'hr') {
        return true;
    }
    
    // Managers can access their own department (implement department check)
    if (user.role === 'manager') {
        return true; // Add department-specific logic here
    }
    
    return false;
};

const filterUpdateData = (updateData, user) => {
    const allowedFields = ['firstName', 'lastName', 'department', 'role', 'documents'];
    
    // HR can update salary information
    if (user.role === 'hr' || user.isAdmin) {
        allowedFields.push('salary');
    }
    
    const filteredData = {};
    allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
            filteredData[field] = updateData[field];
        }
    });
    
    return filteredData;
};