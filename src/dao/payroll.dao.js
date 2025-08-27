import Payroll from "../models/payroll.model.js";
import { findEmployeeByUserId, findEmployeeById, findEmployees } from "./employee.dao.js";

export const runPayrollCycle = async (requestingUser, payrollData) => {
    try {
        const { employees, month, year } = payrollData;

        // Validate requesting user permissions
        if (!canRunPayroll(requestingUser)) {
            throw new Error('Insufficient permissions to run payroll');
        }

        // Validate inputs
        if (!Array.isArray(employees) || employees.length === 0) {
            throw new Error('Employees array is required and cannot be empty');
        }

        if (!month || month < 1 || month > 12) {
            throw new Error('Invalid month. Must be between 1 and 12');
        }

        if (!year || year < 2020 || year > new Date().getFullYear() + 1) {
            throw new Error('Invalid year');
        }

        // Check if payroll cycle already run for this month/year
        const existingPayrolls = await Payroll.find({
            employee: { $in: employees },
            month,
            year
        }).select('employee');

        if (existingPayrolls.length > 0) {
            const existingEmployeeIds = existingPayrolls.map(p => p.employee.toString());
            const duplicateEmployees = employees.filter(empId => 
                existingEmployeeIds.includes(empId.toString())
            );
            
            if (duplicateEmployees.length > 0) {
                throw new Error(`Payroll already exists for ${duplicateEmployees.length} employee(s) for ${month}/${year}`);
            }
        }

        const payrolls = [];
        const errors = [];

        // Process employees in batches for better performance
        const batchSize = 10;
        for (let i = 0; i < employees.length; i += batchSize) {
            const batch = employees.slice(i, i + batchSize);
            const batchPromises = batch.map(employeeId => 
                processEmployeePayroll(employeeId, month, year)
            );

            const batchResults = await Promise.allSettled(batchPromises);
            
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    payrolls.push(result.value);
                } else {
                    errors.push(`Employee ${batch[index]}: ${result.reason.message}`);
                }
            });
        }

        // Return results with summary
        return {
            payrolls,
            errors: errors.length > 0 ? errors : undefined,
            summary: {
                total: employees.length,
                successful: payrolls.length,
                failed: errors.length,
                month,
                year
            }
        };
    } catch (error) {
        throw new Error(`Payroll cycle failed: ${error.message}`);
    }
};

export const getPayrollRecords = async (requestingUser, options = {}) => {
    try {
        const {
            employeeId,
            month,
            year,
            department,
            page = 1,
            limit = 20,
            sort = { year: -1, month: -1 }
        } = options;

        // Build filter based on user permissions
        const filter = await buildPayrollFilter(requestingUser, {
            employeeId,
            month,
            year,
            department
        });

        const skip = (page - 1) * limit;

        const payrolls = await Payroll.find(filter)
            .populate('employee', 'firstName lastName department role')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Payroll.countDocuments(filter);

        return {
            payrolls,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        };
    } catch (error) {
        throw new Error(`Error fetching payroll records: ${error.message}`);
    }
};

export const getMyPayrollRecords = async (userId, options = {}) => {
    try {
        const {
            month,
            year,
            page = 1,
            limit = 20,
            sort = { year: -1, month: -1 }
        } = options;

        // Verify employee exists
        const employee = await findEmployeeByUserId(userId, { populate: false });
        if (!employee) {
            throw new Error('Employee profile not found');
        }

        // Build filter
        const filter = { employee: employee._id };
        if (month) filter.month = month;
        if (year) filter.year = year;

        const skip = (page - 1) * limit;

        const payrolls = await Payroll.find(filter)
            .populate('employee', 'firstName lastName department')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Payroll.countDocuments(filter);

        return {
            payrolls,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        };
    } catch (error) {
        throw new Error(`Error fetching your payroll records: ${error.message}`);
    }
};

export const getPayrollById = async (payrollId, requestingUser) => {
    try {
        const payroll = await Payroll.findById(payrollId)
            .populate('employee', 'firstName lastName department role')
            .lean();

        if (!payroll) {
            throw new Error('Payroll record not found');
        }

        // Check if user can access this payroll record
        if (!canAccessPayroll(requestingUser, payroll)) {
            throw new Error('Access denied');
        }

        return payroll;
    } catch (error) {
        throw new Error(`Error fetching payroll record: ${error.message}`);
    }
};

export const updatePayrollRecord = async (payrollId, updateData, requestingUser) => {
    try {
        // Validate permissions
        if (!canUpdatePayroll(requestingUser)) {
            throw new Error('Insufficient permissions to update payroll');
        }

        const payroll = await Payroll.findById(payrollId);
        if (!payroll) {
            throw new Error('Payroll record not found');
        }

        // Validate update data
        const allowedUpdates = ['basic', 'allowance', 'deductions', 'tax', 'paidOn', 'payslipUrl'];
        const updates = Object.keys(updateData);
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            throw new Error('Invalid update fields');
        }

        // Recalculate net salary if salary components are updated
        if (updates.some(field => ['basic', 'allowance', 'deductions', 'tax'].includes(field))) {
            const basic = updateData.basic || payroll.basic || 0;
            const allowance = updateData.allowance || payroll.allowance || 0;
            const deductions = updateData.deductions || payroll.deductions || 0;
            const tax = updateData.tax || payroll.tax || 0;
            
            updateData.netSalary = basic + allowance - deductions - tax;
        }

        const updatedPayroll = await Payroll.findByIdAndUpdate(
            payrollId,
            updateData,
            { new: true, runValidators: true }
        ).populate('employee', 'firstName lastName department');

        return updatedPayroll;
    } catch (error) {
        throw new Error(`Payroll update failed: ${error.message}`);
    }
};

export const deletePayrollRecord = async (payrollId, requestingUser) => {
    try {
        // Validate permissions
        if (!canDeletePayroll(requestingUser)) {
            throw new Error('Insufficient permissions to delete payroll');
        }

        const payroll = await Payroll.findById(payrollId);
        if (!payroll) {
            throw new Error('Payroll record not found');
        }

        // Check if payroll is already paid
        if (payroll.paidOn) {
            throw new Error('Cannot delete paid payroll record');
        }

        await Payroll.findByIdAndDelete(payrollId);
        return { message: 'Payroll record deleted successfully' };
    } catch (error) {
        throw new Error(`Payroll deletion failed: ${error.message}`);
    }
};

export const getPayrollStats = async (requestingUser, options = {}) => {
    try {
        const { year = new Date().getFullYear(), department } = options;

        // Build filter based on permissions
        const filter = await buildPayrollFilter(requestingUser, { year, department });

        const stats = await Payroll.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: 'employees',
                    localField: 'employee',
                    foreignField: '_id',
                    as: 'employeeData'
                }
            },
            { $unwind: '$employeeData' },
            {
                $group: {
                    _id: {
                        month: '$month',
                        department: '$employeeData.department'
                    },
                    totalEmployees: { $sum: 1 },
                    totalBasic: { $sum: '$basic' },
                    totalAllowance: { $sum: '$allowance' },
                    totalDeductions: { $sum: '$deductions' },
                    totalTax: { $sum: '$tax' },
                    totalNetSalary: { $sum: '$netSalary' },
                    avgNetSalary: { $avg: '$netSalary' }
                }
            },
            {
                $group: {
                    _id: '$_id.month',
                    departments: {
                        $push: {
                            department: '$_id.department',
                            totalEmployees: '$totalEmployees',
                            totalBasic: '$totalBasic',
                            totalAllowance: '$totalAllowance',
                            totalDeductions: '$totalDeductions',
                            totalTax: '$totalTax',
                            totalNetSalary: '$totalNetSalary',
                            avgNetSalary: { $round: ['$avgNetSalary', 2] }
                        }
                    },
                    monthlyTotal: { $sum: '$totalNetSalary' },
                    monthlyEmployees: { $sum: '$totalEmployees' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return {
            year,
            monthlyStats: stats,
            summary: {
                totalMonths: stats.length,
                totalEmployees: stats.reduce((sum, month) => sum + month.monthlyEmployees, 0),
                totalPayout: stats.reduce((sum, month) => sum + month.monthlyTotal, 0)
            }
        };
    } catch (error) {
        throw new Error(`Error calculating payroll stats: ${error.message}`);
    }
};

export const generatePayslip = async (payrollId, requestingUser) => {
    try {
        const payroll = await getPayrollById(payrollId, requestingUser);
        
        // Generate payslip URL (implement your payslip generation logic here)
        const payslipUrl = `/payslips/${payroll.employee._id}_${payroll.month}_${payroll.year}.pdf`;
        
        // Update payroll record with payslip URL
        await Payroll.findByIdAndUpdate(payrollId, { payslipUrl });
        
        return {
            payslipUrl,
            message: 'Payslip generated successfully'
        };
    } catch (error) {
        throw new Error(`Payslip generation failed: ${error.message}`);
    }
};

// Helper functions
const processEmployeePayroll = async (employeeId, month, year) => {
    try {
        // Fetch employee data
        const employee = await findEmployeeById(employeeId, { populate: false });
        if (!employee) {
            throw new Error(`Employee not found with ID: ${employeeId}`);
        }

        // Calculate salary components
        const basic = employee.salary?.base || 30000;
        const allowance = employee.salary?.allowance || 5000;
        const deductions = employee.salary?.deductions || 2000;
        const tax = Math.round(basic * 0.1); // 10% tax
        const netSalary = basic + allowance - deductions - tax;

        // Create payroll record
        const payroll = await Payroll.create({
            employee: employeeId,
            month,
            year,
            basic,
            allowance,
            deductions,
            tax,
            netSalary,
            paidOn: new Date(),
            payslipUrl: `/payslips/${employeeId}_${month}_${year}.pdf`
        });

        return await Payroll.findById(payroll._id).populate('employee', 'firstName lastName department');
    } catch (error) {
        throw error;
    }
};

const buildPayrollFilter = async (requestingUser, params) => {
    const filter = {};

    // Apply month/year filters
    if (params.month) filter.month = params.month;
    if (params.year) filter.year = params.year;

    // Apply employee filter
    if (params.employeeId) {
        filter.employee = params.employeeId;
    }

    // Role-based filtering
    if (requestingUser.role === 'employee') {
        const employee = await findEmployeeByUserId(requestingUser.id, { populate: false });
        if (employee) {
            filter.employee = employee._id;
        }
    }

    // Apply department filter for managers
    if (params.department) {
        const employees = await findEmployeesByDepartment(params.department, { 
            select: '_id',
            populate: false 
        });
        filter.employee = { $in: employees.employees.map(emp => emp._id) };
    }

    return filter;
};

// Permission helper functions
const canRunPayroll = (user) => {
    return user.isAdmin || user.role === 'admin' || user.role === 'hr';
};

const canUpdatePayroll = (user) => {
    return user.isAdmin || user.role === 'admin' || user.role === 'hr';
};

const canDeletePayroll = (user) => {
    return user.isAdmin || user.role === 'admin';
};

const canAccessPayroll = (requestingUser, payroll) => {
    // Admin and HR can access all payroll records
    if (requestingUser.isAdmin || requestingUser.role === 'admin' || requestingUser.role === 'hr') {
        return true;
    }

    // Managers can access their department's payroll records
    if (requestingUser.role === 'manager') {
        return true; // Add department-specific logic here
    }

    // Employees can only access their own payroll records
    if (requestingUser.role === 'employee' && payroll.employee && payroll.employee._id) {
        return payroll.employee._id.toString() === requestingUser.id;
    }

    return false;
};