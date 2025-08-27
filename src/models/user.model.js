import mongoose from 'mongoose';
import validator from 'validator';

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            trim: true,
            minlength: [3, 'Username must be at least 3 characters'],
            maxlength: [20, 'Username cannot exceed 20 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            validate: [validator.isEmail, 'Please provide a valid email']
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters']
        },
        role: {
            type: String,
            enum: {
                values: ['admin', 'hr', 'manager', 'employee'],
                message: 'Role must be one of: admin, hr, manager, employee'
            },
            default: 'employee'
        },
        isAdmin: {
            type: Boolean,
            default: false
        },
        refreshToken: {
            type: String,
            default: null
        },
        lastLogin: {
            type: Date,
            default: null
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });


const User = mongoose.model('User', userSchema);
export default User;