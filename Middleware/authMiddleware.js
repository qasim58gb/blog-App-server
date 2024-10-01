import User from "../Models/userModel.js";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import * as dotenv from "dotenv";

dotenv.config();
export const protect = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      res.status(401);
      throw new Error("Unauthorized user, please log in");
    }

    const verified = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(verified._id).select("-password");

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Unauthorized user, please log in");
  }
});

export const superAdminOnly = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "superAdmin") {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorize user as a superAdmin");
  }
});
