import mongoose from 'mongoose';
import config from '../config/config.js'

function connectDB() {
    const dbUrl = config.DB_URL
    mongoose.connect(dbUrl)
        .then(() => console.log('MongoDB connected'))
        .catch((err) => console.error('Error connecting to MongoDB:', err))
}

export default connectDB;