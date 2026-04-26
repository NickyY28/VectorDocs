import mongoose from "mongoose";

const pdfSchema = new mongoose.Schema(
    {
        userID: {type: mongoose.Schema.Types.ObjectId, ref:"User", required: true},
        name: {type: String, required: true},
        storedName: {type: String, required: true},
        pageCount: {type: Number, default: 0},
        size: {type: Number, default: 0},
        vectorized: { type: Boolean, default: false },
        collectionId: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model("PDF", pdfSchema)