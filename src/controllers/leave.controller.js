// controllers/leave.controller.js
import { requestLeave, updateLeaveStatus, getFindAllLeaves } from "../dao/leave.dao.js";

export const requestLeaveController = async (req, res, next) => {
    try {
        const { startDate, endDate, reason } = req.body;
        const leave = await requestLeave(req.user.id, startDate, endDate, reason);
        res.status(201).json({ success: true, data: leave });
    } catch (error) {
        next(error);
    }
};

export const getAllLeavesController = async (req, res, next) => {
    try {
        const leaves = await getFindAllLeaves(req.user.id);
        res.status(200).json({ success: true, data: leaves });
    } catch (error) {
        next(error);
    }
};

export const approveLeaveController = async (req, res, next) => {
    try {
        const { status, leaveId } = req.body; // "Approved" or "Rejected"
        const leave = await updateLeaveStatus(leaveId, status);
        res.status(200).json({ success: true, data: leave });
    } catch (error) {
        next(error);
    }
};
