import mongoose from 'mongoose';

const mongoURI = process.env.AUTH_SERVICE_MONGO_URL || 'mongodb://127.0.0.1:27017/lms-auth-db';
const connectDB = async () => {
    try {
        const connection = await mongoose.connect(mongoURI);
        console.log(`MongoDB Connected: ${connection.connection.host}`);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

export default connectDB;