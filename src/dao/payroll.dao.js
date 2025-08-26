// dao/payroll.dao.js
import employeeModel from "../models/employee.model.js";
import Payroll from "../models/payroll.model.js";

export const runPayrollCycle = async (employees, month, year) => {
    // Validate inputs
    if (!Array.isArray(employees)) {
        throw new Error('Employees parameter must be an array');
    }

    if (employees.length === 0) {
        throw new Error('Employees array cannot be empty');
    }

    if (!month || month < 1 || month > 12) {
        throw new Error('Invalid month. Must be between 1 and 12');
    }


    const payrolls = [];
    const errors = [];

    for (const emp of employees) {
        try {
            // Extract employee ID
            let employeeId;
            if (typeof emp === 'string') {
                employeeId = emp;
            } else if (emp._id) {
                employeeId = emp._id;
            } else if (emp.id) {
                employeeId = emp.id;
            } else {
                throw new Error(`Invalid employee data: missing ID`);
            }

            // Check if payroll already exists for this employee, month, and year
            const existingPayroll = await Payroll.findOne({ 
                employee: employeeId, 
                month, 
                year 
            });

            if (existingPayroll) {
                errors.push(`Payroll already exists for employee ${employeeId} for ${month}/${year}`);
                continue;
            }

            // Fetch employee data from database
            const employeeData = await employeeModel.findById(employeeId);
            
            if (!employeeData) {
                errors.push(`Employee not found with ID: ${employeeId}`);
                continue;
            }

            // Calculate salary components
            const basic = employeeData.salary?.base || 30000;
            const allowance = employeeData.salary?.allowance || 5000;
            const deductions = employeeData.salary?.deductions || 2000;
            const tax = Math.round(basic * 0.1); // 10% tax, rounded
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
                payslipUrl: `/payslip/${employeeId}_${month}_${year}.pdf`
            });

            payrolls.push(payroll);

        } catch (error) {
            errors.push(`Error processing employee ${emp}: ${error.message}`);
        }
    }

    // If there were errors but some payrolls were created successfully
    if (errors.length > 0 && payrolls.length > 0) {
        console.warn('Payroll cycle completed with errors:', errors);
    }

    // If all employees failed
    if (payrolls.length === 0) {
        throw new Error(`Payroll cycle failed: ${errors.join(', ')}`);
    }

    return {
        payrolls,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
            total: employees.length,
            successful: payrolls.length,
            failed: errors.length
        }
    };
};

export const calculateSalary = async (employeeId, month, year) => {
    return await Payroll.findOne({ employee: employeeId, month, year }).populate("employee");
};

export const getPayslip = async (employeeId, month, year) => {
    return await Payroll.findOne({ employee: employeeId, month, year });
};
