import dotenv from 'dotenv';

dotenv.config();

const config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 3000,
    ADMIN_SECRET_CODE: process.env.ADMIN_SECRET_CODE,
    DB_URL: process.env.MONGODB_URL || 'mongodb://localhost:27017/mydatabase',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiry: process.env.JWT_EXPIRY,
    jwtRefresh: process.env.REFRESH_SECRET,
};

export default config;
