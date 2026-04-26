import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    role: {type: String, enum: ["user", "assistant"], require: true},
    content: {type: String, required: true},
    // Only assistant messages have chunks
    chunks: [
    {
      text: String,       // snippet from PDF
      score: Number,      // raw similarity score from ChromaDB
      page: Number,       // page number in PDF
    },
    ],
    createdAt: { type: Date, default: Date.now },
});

const chatHistorySchema = new mongoose.Schema(
    {
        userId:{type: mongoose.Schema.Types.ObjectId, ref: "User", require: true},
        pdfId:{type: mongoose.Schema.Types.ObjectId, ref: "PDF", require: true},
        messages : [messageSchema],
    },
    {timestamps: true}
);

export default mongoose.model("chatHistory", chatHistorySchema)