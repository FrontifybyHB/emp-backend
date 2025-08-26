// controllers/payroll.controller.js
import { runPayrollCycle, calculateSalary, getPayslip } from "../dao/payroll.dao.js";

export const runPayrollCycleController = async (req, res, next) => {
    try {
        const { employee, employees, month, year } = req.body;

        const employeeList = employee || employees;

        if (!Array.isArray(employeeList)) {
            return res.status(400).json({
                success: false,
                message: 'Employees must be an array'
            });
        }

        if (employeeList.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Employee list cannot be empty'
            });
        }

        const payrolls = await runPayrollCycle(employeeList, month, year);
        return res.status(201).json({
            message: 'Payroll cycle run successfully',
            success: true,
            data: payrolls
        });
    } catch (error) {
        next(error);
    }
};

export const calculateSalaryController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { month, year } = req.query;
        const payroll = await calculateSalary(id, month, year);
        return res.status(200).json({
            message: 'Salary calculated successfully',
            success: true,
            data: payroll
        });
    } catch (error) {
        next(error);
    }
};

export const getPayslipController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { month, year } = req.query;
        const payslip = await getPayslip(id, month, year);
        return res.status(200).json({
            success: true,
            data: payslip
        });
    } catch (error) {
        next(error);
    }
};
