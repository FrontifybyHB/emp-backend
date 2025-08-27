import express from "express";
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';


// Import Config
import config from './config/config.js';

// Import Routes
import authRoutes from './routes/auth.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import leaveRoutes from './routes/leave.routes.js';
import payrollRoutes from './routes/payroll.routes.js';
import performanceRoutes from './routes/performance.routes.js';

// Import Middleware
import { errorHandler } from './middlewares/error.handler.js';
import { apiLimiter } from "./middlewares/ratelimit.middleware.js";


// Initialize app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: config.CLIENT_URL, credentials: true }));
app.use(helmet());
app.use(morgan('dev'));
app.use(apiLimiter);


// Routes
app.use('/api/auth', authRoutes);
app.use("/api/employees", employeeRoutes); 
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/performance', performanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'EMS Backend is running' });
});

// Error handling
app.use(errorHandler);



export default app;