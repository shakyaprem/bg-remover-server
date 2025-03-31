import mongoose from "mongoose";

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    mongoose.connection.on('connected', () => {
        console.log('Connected to MongoDB');
    });
    await mongoose.connect(`${uri}/mern-auth`);
}

export default connectDB;