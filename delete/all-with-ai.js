// ================================
// PROJECT STRUCTURE
// ================================
/*
employee-management-system/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── config.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Employee.js
│   │   ├── Attendance.js
│   │   ├── Leave.js
│   │   ├── Payroll.js
│   │   └── Performance.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── employees.js
│   │   ├── attendance.js
│   │   ├── payroll.js
│   │   └── performance.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── employeeController.js
│   │   ├── attendanceController.js
│   │   ├── payrollController.js
│   │   └── performanceController.js
│   ├── services/
│   │   ├── emailService.js
│   │   └── payrollService.js
│   └── utils/
│       ├── validators.js
│       └── helpers.js
├── package.json
└── server.js
*/

// ================================
// PACKAGE.JSON
// ================================
const packageJson = {
  "name": "employee-management-system",
  "version": "1.0.0",
  "description": "Comprehensive Employee Management System Backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "joi": "^17.9.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.10.0",
    "multer": "^1.4.5",
    "winston": "^3.10.0",
    "nodemailer": "^6.9.4",
    "cron": "^2.4.1",
    "moment": "^2.29.4",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.2",
    "supertest": "^6.3.3"
  }
};

// ================================
// SERVER.JS - Main Application Entry Point
// ================================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
require('dotenv').config();

// Import routes
const authRoutes = require('./src/routes/auth');
const employeeRoutes = require('./src/routes/employees');
const attendanceRoutes = require('./src/routes/attendance');
const payrollRoutes = require('./src/routes/payroll');
const performanceRoutes = require('./src/routes/performance');

// Import middleware
const errorHandler = require('./src/middleware/errorHandler');
const { connectDB } = require('./src/config/database');

const app = express();

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ems-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/performance', performanceRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;

// ================================
// CONFIG/DATABASE.JS
// ================================
const mongoose = require('mongoose');
const winston = require('winston');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/employee_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = { connectDB };

// ================================
// CONFIG/CONFIG.JS
// ================================
const config = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
  },
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword']
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
};

module.exports = config;

// ================================
// MODELS/USER.JS
// ================================
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'hr', 'manager', 'employee'],
    default: 'employee'
  },
  permissions: [{
    type: String,
    enum: [
      'read_employees', 'write_employees', 'delete_employees',
      'read_attendance', 'write_attendance',
      'read_payroll', 'write_payroll',
      'read_performance', 'write_performance'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  refreshToken: {
    type: String
  }
}, {
  timestamps: true
});

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Method to get role permissions
userSchema.methods.getRolePermissions = function() {
  const rolePermissions = {
    admin: [
      'read_employees', 'write_employees', 'delete_employees',
      'read_attendance', 'write_attendance',
      'read_payroll', 'write_payroll',
      'read_performance', 'write_performance'
    ],
    hr: [
      'read_employees', 'write_employees',
      'read_attendance', 'write_attendance',
      'read_payroll', 'write_payroll',
      'read_performance', 'write_performance'
    ],
    manager: [
      'read_employees', 'write_employees',
      'read_attendance', 'read_performance', 'write_performance'
    ],
    employee: [
      'read_employees'
    ]
  };
  
  return [...(rolePermissions[this.role] || []), ...this.permissions];
};

module.exports = mongoose.model('User', userSchema);

// ================================
// MODELS/EMPLOYEE.JS
// ================================
const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  personalInfo: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true
    },
    phoneNumber: {
      type: String,
      required: true,
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phoneNumber: String
    }
  },
  workInfo: {
    department: {
      type: String,
      required: true,
      enum: ['Engineering', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations']
    },
    position: {
      type: String,
      required: true
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    dateOfJoining: {
      type: Date,
      required: true
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Intern'],
      default: 'Full-time'
    },
    workLocation: {
      type: String,
      enum: ['Office', 'Remote', 'Hybrid'],
      default: 'Office'
    },
    salary: {
      baseSalary: {
        type: Number,
        required: true,
        min: 0
      },
      currency: {
        type: String,
        default: 'USD'
      },
      effectiveDate: {
        type: Date,
        default: Date.now
      }
    }
  },
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['Resume', 'ID', 'Contract', 'Certificate', 'Other']
    },
    filePath: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  terminationDate: Date,
  terminationReason: String
}, {
  timestamps: true
});

// Indexes for performance
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ userId: 1 });
employeeSchema.index({ 'workInfo.department': 1 });
employeeSchema.index({ 'workInfo.managerId': 1 });

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Pre-save middleware to generate employee ID
employeeSchema.pre('save', async function(next) {
  if (this.isNew && !this.employeeId) {
    const count = await mongoose.model('Employee').countDocuments();
    this.employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);

// ================================
// MODELS/ATTENDANCE.JS
// ================================
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  clockIn: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    ipAddress: String
  },
  clockOut: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    ipAddress: String
  },
  breaks: [{
    startTime: Date,
    endTime: Date,
    type: {
      type: String,
      enum: ['Lunch', 'Short', 'Meeting'],
      default: 'Short'
    }
  }],
  totalWorkingHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half-day', 'Holiday'],
    default: 'Present'
  },
  overtime: {
    hours: {
      type: Number,
      default: 0
    },
    approved: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    }
  },
  notes: String
}, {
  timestamps: true
});

// Indexes for performance
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });

// Calculate working hours before saving
attendanceSchema.pre('save', function(next) {
  if (this.clockIn.time && this.clockOut.time) {
    const workingMs = this.clockOut.time.getTime() - this.clockIn.time.getTime();
    
    // Subtract break time
    const breakMs = this.breaks.reduce((total, breakItem) => {
      if (breakItem.startTime && breakItem.endTime) {
        return total + (breakItem.endTime.getTime() - breakItem.startTime.getTime());
      }
      return total;
    }, 0);
    
    this.totalWorkingHours = (workingMs - breakMs) / (1000 * 60 * 60);
    
    // Calculate overtime (assuming 8 hours standard)
    if (this.totalWorkingHours > 8) {
      this.overtime.hours = this.totalWorkingHours - 8;
    }
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);

// ================================
// MODELS/LEAVE.JS
// ================================
const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  type: {
    type: String,
    enum: ['Annual', 'Sick', 'Maternity', 'Paternity', 'Personal', 'Emergency'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  days: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  approvedDate: Date,
  rejectionReason: String,
  attachments: [{
    fileName: String,
    filePath: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  handoverNotes: String,
  handoverTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }
}, {
  timestamps: true
});

// Indexes for performance
leaveSchema.index({ employeeId: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });

// Calculate number of days
leaveSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const timeDiff = this.endDate.getTime() - this.startDate.getTime();
    this.days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  }
  next();
});

module.exports = mongoose.model('Leave', leaveSchema);

// ================================
// MODELS/PAYROLL.JS
// ================================
const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  payPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true
    }
  },
  salary: {
    baseSalary: {
      type: Number,
      required: true
    },
    hourlyRate: Number,
    hoursWorked: {
      type: Number,
      default: 0
    },
    overtimeHours: {
      type: Number,
      default: 0
    },
    overtimeRate: {
      type: Number,
      default: 1.5
    }
  },
  earnings: {
    basicPay: {
      type: Number,
      required: true
    },
    overtimePay: {
      type: Number,
      default: 0
    },
    bonuses: [{
      type: String,
      amount: Number,
      description: String
    }],
    allowances: [{
      type: String,
      amount: Number,
      description: String
    }],
    totalEarnings: {
      type: Number,
      required: true
    }
  },
  deductions: {
    tax: {
      federal: Number,
      state: Number,
      local: Number
    },
    socialSecurity: Number,
    medicare: Number,
    insurance: [{
      type: String,
      amount: Number,
      description: String
    }],
    retirement: Number,
    other: [{
      type: String,
      amount: Number,
      description: String
    }],
    totalDeductions: {
      type: Number,
      required: true
    }
  },
  netPay: {
    type: Number,
    required: true
  },
  paymentDetails: {
    method: {
      type: String,
      enum: ['Bank Transfer', 'Check', 'Cash'],
      default: 'Bank Transfer'
    },
    bankAccount: {
      accountNumber: String,
      routingNumber: String,
      bankName: String
    },
    paymentDate: Date,
    status: {
      type: String,
      enum: ['Draft', 'Processed', 'Paid', 'Failed'],
      default: 'Draft'
    }
  },
  payslipGenerated: {
    type: Boolean,
    default: false
  },
  payslipPath: String
}, {
  timestamps: true
});

// Indexes for performance
payrollSchema.index({ employeeId: 1, 'payPeriod.month': 1, 'payPeriod.year': 1 }, { unique: true });
payrollSchema.index({ 'payPeriod.year': 1, 'payPeriod.month': 1 });

// Calculate net pay before saving
payrollSchema.pre('save', function(next) {
  // Calculate total earnings
  const bonusTotal = this.earnings.bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
  const allowanceTotal = this.earnings.allowances.reduce((sum, allowance) => sum + allowance.amount, 0);
  this.earnings.totalEarnings = this.earnings.basicPay + this.earnings.overtimePay + bonusTotal + allowanceTotal;

  // Calculate total deductions
  const taxTotal = (this.deductions.tax.federal || 0) + (this.deductions.tax.state || 0) + (this.deductions.tax.local || 0);
  const insuranceTotal = this.deductions.insurance.reduce((sum, ins) => sum + ins.amount, 0);
  const otherTotal = this.deductions.other.reduce((sum, other) => sum + other.amount, 0);
  
  this.deductions.totalDeductions = taxTotal + 
    (this.deductions.socialSecurity || 0) + 
    (this.deductions.medicare || 0) + 
    insuranceTotal + 
    (this.deductions.retirement || 0) + 
    otherTotal;

  // Calculate net pay
  this.netPay = this.earnings.totalEarnings - this.deductions.totalDeductions;
  
  next();
});

module.exports = mongoose.model('Payroll', payrollSchema);

// ================================
// MODELS/PERFORMANCE.JS
// ================================
const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  reviewPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['Annual', 'Semi-Annual', 'Quarterly', 'Monthly', 'Project-based'],
      default: 'Annual'
    }
  },
  goals: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    category: {
      type: String,
      enum: ['Performance', 'Development', 'Behavioral', 'Strategic'],
      default: 'Performance'
    },
    targetDate: Date,
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'Overdue'],
      default: 'Not Started'
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    completionDate: Date,
    notes: String
  }],
  ratings: {
    overall: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    categories: [{
      name: {
        type: String,
        required: true
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
      },
      comments: String
    }]
  },
  feedback: {
    strengths: [String],
    areasForImprovement: [String],
    managerComments: String,
    employeeSelfAssessment: String,
    developmentPlan: String
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  reviewDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Draft', 'In Review', 'Completed', 'Acknowledged'],
    default: 'Draft'
  },
  employeeAcknowledgment: {
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedDate: Date,
    employeeComments: String
  }
}, {
  timestamps: true
});

// Indexes for performance
performanceSchema.index({ employeeId: 1, reviewDate: 1 });
performanceSchema.index({ reviewedBy: 1 });
performanceSchema.index({ status: 1 });

module.exports = mongoose.model('Performance', performanceSchema);

// ================================
// MIDDLEWARE/AUTH.JS
// ================================
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.userId).select('-password -refreshToken');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Check permissions
const authorize = (permissions = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userPermissions = req.user.getRolePermissions();
    
    // Check if user has required permissions
    const hasPermission = permissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Role-based authorization
const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role privileges'
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize, requireRole };

// ================================
// MIDDLEWARE/ERRORHANDLER.JS
// ================================
const winston = require('winston');

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log' }),
    new winston.transports.Console()
  ]
});

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;

// ================================
// MIDDLEWARE/VALIDATION.JS
// ================================
const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    next();
  };
};

// Validation schemas
const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid('admin', 'hr', 'manager', 'employee').default('employee')
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  employee: Joi.object({
    personalInfo: Joi.object({
      firstName: Joi.string().max(50).required(),
      lastName: Joi.string().max(50).required(),
      dateOfBirth: Joi.date().required(),
      gender: Joi.string().valid('Male', 'Female', 'Other').required(),
      phoneNumber: Joi.string().pattern(/^\+?[\d\s-()]+$/).required(),
      address: Joi.object({
        street: Joi.string(),
        city: Joi.string(),
        state: Joi.string(),
        zipCode: Joi.string(),
        country: Joi.string()
      }),
      emergencyContact: Joi.object({
        name: Joi.string(),
        relationship: Joi.string(),
        phoneNumber: Joi.string()
      })
    }).required(),
    workInfo: Joi.object({
      department: Joi.string().valid('Engineering', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations').required(),
      position: Joi.string().required(),
      managerId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
      dateOfJoining: Joi.date().required(),
      employmentType: Joi.string().valid('Full-time', 'Part-time', 'Contract', 'Intern').default('Full-time'),
      workLocation: Joi.string().valid('Office', 'Remote', 'Hybrid').default('Office'),
      salary: Joi.object({
        baseSalary: Joi.number().min(0).required(),
        currency: Joi.string().default('USD'),
        effectiveDate: Joi.date().default(Date.now)
      }).required()
    }).required()
  }),

  clockIn: Joi.object({
    location: Joi.object({
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
      address: Joi.string()
    })
  }),

  leaveRequest: Joi.object({
    type: Joi.string().valid('Annual', 'Sick', 'Maternity', 'Paternity', 'Personal', 'Emergency').required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    reason: Joi.string().max(500).required(),
    handoverNotes: Joi.string(),
    handoverTo: Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
  }),

  performance: Joi.object({
    employeeId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    reviewPeriod: Joi.object({
      startDate: Joi.date().required(),
      endDate: Joi.date().required(),
      type: Joi.string().valid('Annual', 'Semi-Annual', 'Quarterly', 'Monthly', 'Project-based').default('Annual')
    }).required(),
    goals: Joi.array().items(Joi.object({
      title: Joi.string().required(),
      description: Joi.string(),
      category: Joi.string().valid('Performance', 'Development', 'Behavioral', 'Strategic').default('Performance'),
      targetDate: Joi.date(),
      status: Joi.string().valid('Not Started', 'In Progress', 'Completed', 'Overdue').default('Not Started')
    })),
    ratings: Joi.object({
      overall: Joi.number().min(1).max(5).required(),
      categories: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        rating: Joi.number().min(1).max(5).required(),
        comments: Joi.string()
      }))
    }).required()
  })
};

module.exports = { validate, schemas };

// ================================
// CONTROLLERS/AUTHCONTROLLER.JS
// ================================
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const config = require('../config/config');

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
  
  const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn
  });

  return { accessToken, refreshToken };
};

// Register new user
const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = new User({ email, password, role });
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // Update user
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          permissions: user.getRolePermissions()
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(token, config.jwt.refreshSecret);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== token || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    
    // Update refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token refresh failed',
      error: error.message
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.refreshToken = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id })
      .populate('userId', 'email role isActive')
      .populate('workInfo.managerId', 'personalInfo.firstName personalInfo.lastName');

    res.json({
      success: true,
      data: {
        user: req.user,
        employee
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe
};

// ================================
// CONTROLLERS/EMPLOYEECONTROLLER.JS
// ================================
const Employee = require('../models/Employee');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/documents/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Create new employee
const createEmployee = async (req, res) => {
  try {
    const { email, password, role = 'employee', ...employeeData } = req.body;

    // Create user account first
    const user = new User({ email, password, role });
    await user.save();

    // Create employee profile
    const employee = new Employee({
      ...employeeData,
      userId: user._id
    });

    await employee.save();

    // Populate user data
    await employee.populate('userId', 'email role isActive');

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create employee',
      error: error.message
    });
  }
};

// Get all employees with pagination and filtering
const getEmployees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      department,
      position,
      employmentType,
      workLocation,
      isActive,
      search
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (department) filter['workInfo.department'] = department;
    if (position) filter['workInfo.position'] = new RegExp(position, 'i');
    if (employmentType) filter['workInfo.employmentType'] = employmentType;
    if (workLocation) filter['workInfo.workLocation'] = workLocation;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Search in name and employee ID
    if (search) {
      filter.$or = [
        { 'personalInfo.firstName': new RegExp(search, 'i') },
        { 'personalInfo.lastName': new RegExp(search, 'i') },
        { employeeId: new RegExp(search, 'i') }
      ];
    }

    const employees = await Employee.find(filter)
      .populate('userId', 'email role isActive')
      .populate('workInfo.managerId', 'personalInfo.firstName personalInfo.lastName employeeId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Employee.countDocuments(filter);

    res.json({
      success: true,
      data: {
        employees,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message
    });
  }
};

// Get employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('userId', 'email role isActive lastLogin')
      .populate('workInfo.managerId', 'personalInfo.firstName personalInfo.lastName employeeId');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee',
      error: error.message
    });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('userId', 'email role isActive');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: error.message
    });
  }
};

// Delete employee (soft delete)
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Soft delete - mark as inactive
    employee.isActive = false;
    employee.terminationDate = new Date();
    employee.terminationReason = req.body.reason || 'Terminated by admin';
    await employee.save();

    // Deactivate user account
    await User.findByIdAndUpdate(employee.userId, { isActive: false });

    res.json({
      success: true,
      message: 'Employee terminated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to terminate employee',
      error: error.message
    });
  }
};

// Upload employee document
const uploadDocument = async (req, res) => {
  try {
    upload.single('document')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      const employee = await Employee.findById(req.params.id);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      const document = {
        name: req.file.originalname,
        type: req.body.type || 'Other',
        filePath: req.file.path
      };

      employee.documents.push(document);
      await employee.save();

      res.json({
        success: true,
        message: 'Document uploaded successfully',
        data: document
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
};

// Get employee statistics
const getEmployeeStats = async (req, res) => {
  try {
    const stats = await Employee.aggregate([
      {
        $group: {
          _id: null,
          totalEmployees: { $sum: 1 },
          activeEmployees: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          departmentBreakdown: {
            $push: '$workInfo.department'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalEmployees: 1,
          activeEmployees: 1,
          inactiveEmployees: { $subtract: ['$totalEmployees', '$activeEmployees'] }
        }
      }
    ]);

    // Get department breakdown
    const departmentStats = await Employee.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$workInfo.department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || { totalEmployees: 0, activeEmployees: 0, inactiveEmployees: 0 },
        departmentBreakdown: departmentStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee statistics',
      error: error.message
    });
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  uploadDocument,
  getEmployeeStats
};

// ================================
// ROUTES/AUTH.JS
// ================================
const express = require('express');
const { validate, schemas } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const {
  register,
  login,
  refreshToken,
  logout,
  getMe
} = require('../controllers/authController');

const router = express.Router();

// Public routes
router.post('/register', validate(schemas.register), register);
router.post('/login', validate(schemas.login), login);
router.post('/refresh-token', refreshToken);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

module.exports = router;

// ================================
// ROUTES/EMPLOYEES.JS
// ================================
const express = require('express');
const { validate, schemas } = require('../middleware/validation');
const { authenticate, authorize, requireRole } = require('../middleware/auth');
const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  uploadDocument,
  getEmployeeStats
} = require('../controllers/employeeController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.post('/', 
  requireRole(['admin', 'hr']),
  validate(schemas.employee), 
  createEmployee
);

router.get('/', 
  authorize(['read_employees']), 
  getEmployees
);

router.get('/stats', 
  requireRole(['admin', 'hr']), 
  getEmployeeStats
);

router.get('/:id', 
  authorize(['read_employees']), 
  getEmployeeById
);

router.put('/:id', 
  authorize(['write_employees']), 
  updateEmployee
);

router.delete('/:id', 
  requireRole(['admin', 'hr']), 
  deleteEmployee
);

router.post('/:id/documents', 
  authorize(['write_employees']), 
  uploadDocument
);

module.exports = router;

// ================================
// CONTROLLERS/ATTENDANCECONTROLLER.JS
// ================================
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const moment = require('moment');

// Clock in
const clockIn = async (req, res) => {
  try {
    const { location } = req.body;
    const today = moment().startOf('day').toDate();
    
    // Find employee
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    // Check if already clocked in today
    const existingAttendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today
    });

    if (existingAttendance && existingAttendance.clockIn.time) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked in today'
      });
    }

    // Create or update attendance record
    const attendance = existingAttendance || new Attendance({
      employeeId: employee._id,
      date: today
    });

    attendance.clockIn = {
      time: new Date(),
      location,
      ipAddress: req.ip
    };

    await attendance.save();

    res.json({
      success: true,
      message: 'Clock in successful',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Clock in failed',
      error: error.message
    });
  }
};

// Clock out
const clockOut = async (req, res) => {
  try {
    const { location } = req.body;
    const today = moment().startOf('day').toDate();
    
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today
    });

    if (!attendance || !attendance.clockIn.time) {
      return res.status(400).json({
        success: false,
        message: 'Clock in first'
      });
    }

    if (attendance.clockOut.time) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked out today'
      });
    }

    attendance.clockOut = {
      time: new Date(),
      location,
      ipAddress: req.ip
    };

    await attendance.save();

    res.json({
      success: true,
      message: 'Clock out successful',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Clock out failed',
      error: error.message
    });
  }
};

// Get attendance summary
const getAttendanceSummary = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    
    let targetEmployeeId;
    if (employeeId && ['admin', 'hr', 'manager'].includes(req.user.role)) {
      targetEmployeeId = employeeId;
    } else {
      const employee = await Employee.findOne({ userId: req.user._id });
      targetEmployeeId = employee._id;
    }

    const filter = { employeeId: targetEmployeeId };
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to current month
      const startOfMonth = moment().startOf('month').toDate();
      const endOfMonth = moment().endOf('month').toDate();
      filter.date = { $gte: startOfMonth, $lte: endOfMonth };
    }

    const attendance = await Attendance.find(filter)
      .sort({ date: -1 })
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId');

    // Calculate summary stats
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === 'Present').length;
    const absentDays = attendance.filter(a => a.status === 'Absent').length;
    const lateDays = attendance.filter(a => a.status === 'Late').length;
    const totalWorkingHours = attendance.reduce((sum, a) => sum + a.totalWorkingHours, 0);
    const totalOvertimeHours = attendance.reduce((sum, a) => sum + a.overtime.hours, 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          totalWorkingHours: parseFloat(totalWorkingHours.toFixed(2)),
          totalOvertimeHours: parseFloat(totalOvertimeHours.toFixed(2))
        },
        attendance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance summary',
      error: error.message
    });
  }
};

// Add break time
const addBreak = async (req, res) => {
  try {
    const { type = 'Short' } = req.body;
    const today = moment().startOf('day').toDate();
    
    const employee = await Employee.findOne({ userId: req.user._id });
    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No attendance record found for today'
      });
    }

    // Start break
    attendance.breaks.push({
      startTime: new Date(),
      type
    });

    await attendance.save();

    res.json({
      success: true,
      message: 'Break started',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add break',
      error: error.message
    });
  }
};

// End break
const endBreak = async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();
    
    const employee = await Employee.findOne({ userId: req.user._id });
    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No attendance record found for today'
      });
    }

    // Find last break without end time
    const activeBreak = attendance.breaks.find(b => !b.endTime);
    if (!activeBreak) {
      return res.status(400).json({
        success: false,
        message: 'No active break found'
      });
    }

    activeBreak.endTime = new Date();
    await attendance.save();

    res.json({
      success: true,
      message: 'Break ended',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to end break',
      error: error.message
    });
  }
};

module.exports = {
  clockIn,
  clockOut,
  getAttendanceSummary,
  addBreak,
  endBreak
};

// ================================
// ROUTES/ATTENDANCE.JS
// ================================
const express = require('express');
const { validate, schemas } = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');
const {
  clockIn,
  clockOut,
  getAttendanceSummary,
  addBreak,
  endBreak
} = require('../controllers/attendanceController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/clock-in', validate(schemas.clockIn), clockIn);
router.post('/clock-out', validate(schemas.clockIn), clockOut);
router.get('/summary', authorize(['read_attendance']), getAttendanceSummary);