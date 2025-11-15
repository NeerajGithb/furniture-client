import mongoose, { Schema, Document } from "mongoose";

interface IMessage {
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface IChatSession extends Document {
  sessionId: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  role: { type: String, required: true, enum: ["user", "assistant"] },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const ChatSessionSchema = new Schema<IChatSession>(
  {
    sessionId: { type: String, required: true, unique: true },
    messages: [MessageSchema],
  },
  {
    timestamps: true,
  }
);

ChatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 604800 });

export default mongoose.models.ChatSession || mongoose.model<IChatSession>("ChatSession", ChatSessionSchema);