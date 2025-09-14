import Performance from "../models/performance.model.js";
import mongoose from "mongoose";

// Create or update goals for an employee
export const createOrUpdateGoals = async (employeeId, goals) => {
    try {
        // Validate employeeId
        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            throw new Error('Invalid employee ID format');
        }

        // Prepare goals with proper structure
        const formattedGoals = goals.map(goal => ({
            title: goal.title.trim(),
            description: goal.description.trim(),
            targetDate: new Date(goal.targetDate),
            status: goal.status || 'PENDING',
            createdAt: new Date()
        }));

        const result = await Performance.findOneAndUpdate(
            { employee: employeeId },
            { 
                $push: { goals: { $each: formattedGoals } }
            },
            { upsert: true, new: true }
        ).populate('employee', 'firstName lastName department role');

        return result;
    } catch (error) {
        throw new Error(`Error in createOrUpdateGoals: ${error.message}`);
    }
};

// Update goal status
export const updateGoalStatus = async (employeeId, goalId, status) => {
    try {
        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            throw new Error('Invalid employee ID format');
        }
        if (!mongoose.Types.ObjectId.isValid(goalId)) {
            throw new Error('Invalid goal ID format');
        }

        const result = await Performance.findOneAndUpdate(
            { 
                employee: employeeId, 
                "goals._id": goalId 
            },
            { 
                $set: { 
                    "goals.$.status": status,
                    "goals.$.updatedAt": new Date()
                }
            },
            { new: true }
        ).populate('employee', 'firstName lastName department role');

        if (!result) {
            throw new Error('Goal not found or employee does not exist');
        }

        return result;
    } catch (error) {
        throw new Error(`Error in updateGoalStatus: ${error.message}`);
    }
};
