import mongoose from "mongoose";

const connectDB = async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("db connected");
    } catch (error) {
        console.error("DB connection error :", err)
        process.exit(1);
    }
};

export default connectDB;