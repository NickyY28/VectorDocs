import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import pdfRoutes from "./routes/pdf.js";
import chatRoutes from "./routes/chat.js";
import { connect } from "mongoose";
import connectDB from "./db/db.js";

dotenv.config();

const app = express();

//middleware
app.use(cors({origin:"http://localhost:5173", credentials: true}));
app.use(express.json());
//app.use works for all the requestes -> get, post,put, delete
//routes
app.use("/api/auth", authRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/chat", chatRoutes);

// Health check
app.get("/api/health", (req,res)=> res.json({status: "ok"}));

//start server
const startServer = async () =>{
    await connectDB();
    app.listen(process.env.PORT, () =>
        console.log(`✅ Server running on port ${process.env.PORT}`)
    );
};

startServer();