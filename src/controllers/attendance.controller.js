import { createClockIn, updateClockOut, getSummary, getAllEmployeesSummary } from "../dao/attendance.dao.js";

export const clockInController = async (req, res, next) => {
    try {
        const attendance = await createClockIn(req.user.id);
        res.status(201).json({ success: true, data: attendance });
    } catch (error) {
        next(error);
    }
};

export const clockOutController = async (req, res, next) => {
    try {
        const attendance = await updateClockOut(req.user.id);
        res.status(200).json({ success: true, data: attendance });
    } catch (error) {
        next(error);
    }
};

export const summaryController = async (req, res, next) => {
    try {
        const summary = await getSummary(req.user.id);
        res.status(200).json({ success: true, data: summary });
    } catch (error) {
        next(error);
    }
};

export const allEmployeesSummaryController = async (req, res, next) => {
    try {
        const summary = await getAllEmployeesSummary();
        res.status(200).json({ success: true, data: summary });
    } catch (error) {
        next(error);
    }
};
