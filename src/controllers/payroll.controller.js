import { 
    runPayrollCycle as runPayrollCycleDAO,
    getPayrollRecords,
    getMyPayrollRecords,
    getPayrollById,
    updatePayrollRecord,
    deletePayrollRecord,
    getPayrollStats,
    generatePayslip
} from "../dao/payroll.dao.js";
import { sanitizePayroll, sanitizePayrollList } from "../utils/sanitizer.js";

export const runPayrollCycleController = async (req, res, next) => {
    try {
        const { employees, month, year } = req.body;

        // Validate input
        if (!employees || !Array.isArray(employees) || employees.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Employees array is required and cannot be empty'
            });
        }

        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: 'Month and year are required'
            });
        }

        const result = await runPayrollCycleDAO(req.user, { employees, month, year });
        
        const statusCode = result.errors && result.errors.length > 0 ? 207 : 201; // 207 Multi-Status
        
        res.status(statusCode).json({
            success: true,
            message: result.errors && result.errors.length > 0 
                ? 'Payroll cycle completed with some errors' 
                : 'Payroll cycle completed successfully',
            data: {
                payrolls: sanitizePayrollList(result.payrolls, req.user),
                errors: result.errors,
                summary: result.summary
            }
        });
    } catch (error) {
        if (error.message.includes('permissions') || 
            error.message.includes('Invalid') ||
            error.message.includes('already exists')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        next(error);
    }
};

export const getAllPayrollsController = async (req, res, next) => {
    try {
        const { 
            employeeId,
            month,
            year,
            department,
            page = 1, 
            limit = 20,
            sort = 'year',
            order = 'desc'
        } = req.query;

        // Check department access permissions
        if (department && !canAccessDepartment(req.user, department)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied for this department'
            });
        }

        const sortObj = { [sort]: order === 'desc' ? -1 : 1 };

        const options = {
            employeeId,
            month: month ? parseInt(month) : undefined,
            year: year ? parseInt(year) : undefined,
            department,
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 50),
            sort: sortObj
        };

        const result = await getPayrollRecords(req.user, options);
        
        res.status(200).json({ 
            success: true, 
            message: 'Payroll records retrieved successfully',
            data: {
                payrolls: sanitizePayrollList(result.payrolls, req.user),
                pagination: result.pagination
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getMyPayrollsController = async (req, res, next) => {
    try {
        const { 
            month,
            year,
            page = 1, 
            limit = 20 
        } = req.query;

        const options = {
            month: month ? parseInt(month) : undefined,
            year: year ? parseInt(year) : undefined,
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 50)
        };

        const result = await getMyPayrollRecords(req.user.id, options);
        
        res.status(200).json({ 
            success: true, 
            message: 'Your payroll records retrieved successfully',
            data: {
                payrolls: sanitizePayrollList(result.payrolls, req.user),
                pagination: result.pagination
            }
        });
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'Employee profile not found'
            });
        }
        next(error);
    }
};

export const getPayrollByIdController = async (req, res, next) => {
    try {
        const { payrollId } = req.params;
        
        const payroll = await getPayrollById(payrollId, req.user);
        
        res.status(200).json({ 
            success: true, 
            message: 'Payroll record retrieved successfully',
            data: sanitizePayroll(payroll, req.user)
        });
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'Payroll record not found'
            });
        }
        if (error.message.includes('Access denied')) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        next(error);
    }
};

export const updatePayrollController = async (req, res, next) => {
    try {
        const { payrollId } = req.params;
        const updateData = req.body;

        // Validate allowed fields
        const allowedFields = ['basic', 'allowance', 'deductions', 'tax', 'paidOn', 'payslipUrl'];
        const updateFields = Object.keys(updateData);
        const isValidUpdate = updateFields.every(field => allowedFields.includes(field));

        if (!isValidUpdate) {
            return res.status(400).json({
                success: false,
                message: 'Invalid update fields'
            });
        }

        const payroll = await updatePayrollRecord(payrollId, updateData, req.user);
        
        res.status(200).json({ 
            success: true, 
            message: 'Payroll record updated successfully',
            data: sanitizePayroll(payroll, req.user)
        });
    } catch (error) {
        if (error.message.includes('not found') || 
            error.message.includes('permissions') ||
            error.message.includes('Invalid')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        next(error);
    }
};

export const deletePayrollController = async (req, res, next) => {
    try {
        const { payrollId } = req.params;
        
        const result = await deletePayrollRecord(payrollId, req.user);
        
        res.status(200).json({ 
            success: true, 
            message: result.message
        });
    } catch (error) {
        if (error.message.includes('not found') || 
            error.message.includes('permissions') ||
            error.message.includes('Cannot delete')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        next(error);
    }
};

export const getPayrollStatsController = async (req, res, next) => {
    try {
        const { year, department } = req.query;
        
        // Check department access permissions
        if (department && !canAccessDepartment(req.user, department)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied for this department'
            });
        }

        const options = {
            year: year ? parseInt(year) : undefined,
            department
        };

        const stats = await getPayrollStats(req.user, options);
        
        res.status(200).json({ 
            success: true, 
            message: 'Payroll statistics retrieved successfully',
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

export const generatePayslipController = async (req, res, next) => {
    try {
        const { payrollId } = req.params;
        
        const result = await generatePayslip(payrollId, req.user);
        
        res.status(200).json({ 
            success: true, 
            message: result.message,
            data: { payslipUrl: result.payslipUrl }
        });
    } catch (error) {
        if (error.message.includes('not found') || 
            error.message.includes('Access denied')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        next(error);
    }
};

// Legacy controllers for backward compatibility
export const calculateSalaryController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: 'Month and year are required'
            });
        }

        const result = await getPayrollRecords(req.user, {
            employeeId: id,
            month: parseInt(month),
            year: parseInt(year),
            limit: 1
        });

        const payroll = result.payrolls[0] || null;
        
        res.status(200).json({
            success: true,
            message: payroll ? 'Salary calculated successfully' : 'No payroll record found',
            data: payroll ? sanitizePayroll(payroll, req.user) : null
        });
    } catch (error) {
        next(error);
    }
};

export const getPayslipController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: 'Month and year are required'
            });
        }

        const result = await getPayrollRecords(req.user, {
            employeeId: id,
            month: parseInt(month),
            year: parseInt(year),
            limit: 1
        });

        const payroll = result.payrolls[0] || null;
        
        res.status(200).json({
            success: true,
            message: payroll ? 'Payslip retrieved successfully' : 'No payslip found',
            data: payroll ? sanitizePayroll(payroll, req.user) : null
        });
    } catch (error) {
        next(error);
    }
};

// Helper functions for security and permissions
const canAccessDepartment = (user, department) => {
    // Admin and HR can access all departments
    if (user.isAdmin || user.role === 'admin' || user.role === 'hr') {
        return true;
    }
    
    // Managers can access their own department
    if (user.role === 'manager') {
        return true; // Add department-specific logic here
    }
    
    return false;
};