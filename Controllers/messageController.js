import asyncHandler from "express-async-handler";
import Message from "../Models/messageModel.js";

export const contactUs = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    res.status(400);
    throw new Error("Please fill  the all input");
  }

  const existingMessage = await Message.findOne({ email });
  if (existingMessage) {
    existingMessage.message.push(message);

    await existingMessage.save();

    res.status(201).json({
      message: "Message sent successfully",
    });
  } else {
    const newMessage = await Message.create({
      name,
      email,
      message,
    });

    if (newMessage) {
      res.status(201).json({
        message: "Message sent successfully",
      });
    } else {
      throw new Error("Something went wrong. Please try again.");
    }
  }
});

export const getMessage = asyncHandler(async (req, res) => {
  const message = await Message.find().sort("-createdAt");
  if (!message) {
    res.status(500);
    throw new Error("something went wrong");
  }

  res.status(200).json(message);
});
