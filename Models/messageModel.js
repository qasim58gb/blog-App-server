import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      // match: [
      //   /^(([^<>()[]\\.,;:s@"]+(.[^<>()[]\\.,;:s@"]+)*)|.(".+"))@(([[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}])|(([a-zA-Z-0-9]+.)+[a-zA-Z]{2,}))$/,
      //   "please enter valid email",
      // ],
      unique: true,
      trim: true,
      lowercase: true,
    },
    message: {
      type: [String],
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // This will add createdAt and updatedAt fields
  }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
