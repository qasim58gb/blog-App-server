import mongoose from "mongoose";
import crypto from "crypto";

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "user",
  },

  rToken: {
    type: String,
    default: "",
  },

  createdAt: {
    type: Date,
    required: true,
  },
  expireAt: {
    type: Date,
    required: true,
  },
});
tokenSchema.statics.hashToken = function (token) {
  return crypto.createHash("sha256").update(token.toString()).digest("hex");
};

const Token = mongoose.model("Token", tokenSchema);
export default Token;
