import { 
    createOrUpdateGoals, 
    updateGoalStatus
} from "../dao/performance.dao.js";
import { findEmployeeById, findEmployeeByUserId } from "../dao/employee.dao.js";
import mongoose from "mongoose";

// Set goals for an employee
export const setGoalsController = async (req, res, next) => {
    try {
        const { employeeId, goals } = req.body;

        // Validation
        if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid employee ID is required'
            });
        }

        if (!goals || !Array.isArray(goals) || goals.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Goals array is required and cannot be empty'
            });
        }

        // Validate each goal
        for (const goal of goals) {
            if (!goal.title || goal.title.trim().length < 3) {
                return res.status(400).json({
                    success: false,
                    message: 'Goal title is required and must be at least 3 characters'
                });
            }
            if (!goal.description || goal.description.trim().length < 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Goal description is required and must be at least 10 characters'
                });
            }
            if (!goal.targetDate || new Date(goal.targetDate) <= new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'Goal target date is required and must be in the future'
                });
            }
        }

        // Check if employee exists
        const employee = await findEmployeeById(employeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        const result = await createOrUpdateGoals(employeeId, goals);

        res.status(201).json({
            success: true,
            message: 'Goals set successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// Update goal status
export const updateGoalStatusController = async (req, res, next) => {
    try {
        const { employeeId, goalId } = req.params;
        const { status } = req.body;        // Validation
        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({                success: false,
                message: 'Invalid employee ID format'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(goalId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid goal ID format'
            });
        }

        const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status is required and must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Permission check: employees can only update their own goals
        if (req.user.role === 'employee') {
            const userEmployee = await findEmployeeByUserId(req.user.id);
            if (!userEmployee || userEmployee._id.toString() !== employeeId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only update your own goals'
                });
            }
        }

        // Check if employee exists
        const employee = await findEmployeeById(employeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        const result = await updateGoalStatus(employeeId, goalId, status);

        res.status(200).json({
            success: true,
            message: 'Goal status updated successfully',
            data: result
        });
    } catch (error) {
        if (error.message.includes('Goal not found')) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }
        next(error);
    }
};