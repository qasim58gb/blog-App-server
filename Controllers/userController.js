import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../Models/userModel.js";
import { sendEmail } from "../Utils/sendEmail.js";
import Token from "../Models/tokenModel.js";

// registerUser

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // validation
  if (!name || !email || !password) {
    console.log(name);
    res.status(400);
    throw new Error("Please fill  the all input");
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error("password should be 6 character");
  }

  // check user Already exist
  const userExist = await User.findOne({ email });
  if (userExist) {
    res.status(400);
    throw new Error("User Already exist");
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    password,
  });

  // if user create
  if (user) {
    const { _id, name, email, password, role } = user;
    res.status(201).json({
      _id,
      name,
      email,
      password,
      role,
    });
  } else {
    res.status(400);
    throw new Error("incorrect information of user");
  }
});

// login user
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // validation
  if (!email) {
    res.status(400);
    throw new Error("Please fill all the email");
  }

  if (!password) {
    res.status(400);
    throw new Error("Please fill all the password");
  }
  // check user found
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User ont found. Please signUp");
  }
  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    res.status(400);
    throw new Error("Invalid email or password");
  }

  const token = user.generateAccessToken();

  if (email && password) {
    // send http-only cookie
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 6000 * 86400),
      sameSite: "none",
      secure: true,
    });

    // if user login
    if (user) {
      const { _id, name, email, role } = user;
      res.status(201).json({
        _id,
        name,
        email,
        role,
      });
    } else {
      res.status(500);
      throw new Error("server error");
    }
  }
});

// logout user
export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });
  res.send("logout successful");
});

// get user
export const getUser = asyncHandler(async (req, res) => {
  // const { id } = req.body;
  // console.log(id);
  // const user = await User.findById(id);
  const user = await User.findById(req.user._id);
  if (user) {
    const { _id, name, email, role } = user;
    res.status(200).json({
      _id,
      name,
      email,
      role,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// delete user
export const deleteUser = asyncHandler(async (req, res) => {
  const user = User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("user not found");
  }
  if (user.role === "superAdmin") {
  }
  await User.deleteOne({ _id: req.params.id });
  res.status(200).json({
    message: "user delete",
  });
});
// // get users
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort("-createdAt").select("-password");
  if (!users) {
    res.status(500);
    throw new Error("something went wrong");
  }

  res.status(200).json(users);
});
// //login status
export const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.json(false);
  }

  const verified = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  if (verified) {
    return res.json(true);
  }
  return res.json(false);
});

// change role
export const upgradeRole = asyncHandler(async (req, res) => {
  const { id, role } = req.body;
  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  user.role = role;
  await user.save();
  res.status(200).json({
    message: `User role is upgraded to ${role}`,
  });
});

export const sendAutomatedEmail = asyncHandler(async (req, res) => {
  const { subject, send_to, url } = req.body;

  if (!subject || !send_to) {
    res.status(400);
    throw new Error("Missing the email parameter.");
  }

  const user = await User.findOne({ email: send_to });

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  const sent_from = process.env.EMAIL_USER;
  const reply_to = "noreply@noreply.com";
  const name = user.name;
  const link = `${process.env.FRONTEND_URL}${url}`;

  let p1 = "";
  let btn_text = "";

  if (subject.includes("Password Changed")) {
    p1 = "This is to notify that your account password has changed.";
    btn_text = "Reset Password";
  } else if (subject.includes("Account Status")) {
    p1 = "Your account status has been changed by admin.";
    btn_text = "Login";
  } else {
    p1 = "Please check the details by clicking the button below.";
    btn_text = "Visit your account";
  }

  const p2 = "Visit your account to check.";

  try {
    await sendEmail(
      subject,
      send_to,
      sent_from,
      reply_to,
      name,
      link,
      p1,
      p2,
      btn_text
    );
    res.status(200).json({ message: "Email sent successfully." });
  } catch (error) {
    console.log(error);
    res.status(500);
    throw new Error("Email not sent, please try again.");
  }
});

// // send reset password email

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  let token = await Token.findOne({ userId: user._id });

  if (token) {
    await token.deleteOne();
  }

  // Generate reset password token
  const resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  console.log(resetToken);

  // Hash the reset token
  const hashedToken = Token.hashToken(resetToken);

  // Create a new token entry
  await new Token({
    userId: user._id,
    rToken: hashedToken,
    createdAt: Date.now(),
    expireAt: Date.now() + 60 * 60 * 1000, // 1 hour expiration
  }).save();

  // Reset password URL
  const resetPasswordUrl = `${process.env.FRONTEND_URL}/resetPassword/${resetToken}`;

  // Email details
  const subject = "Reset Password Request";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;
  const reply_to = "qasim@gmail.com";
  const name = user.name;
  const link = resetPasswordUrl;
  const p1 =
    "This is to notify that your account password has been requested for change.";
  const p2 =
    "If you did not initiate this, kindly reset your password immediately within 1 hour.";
  const btn_text = "Reset Password";

  // Send email
  try {
    await sendEmail(
      subject,
      send_to,
      sent_from,
      reply_to,
      name,
      link,
      p1,
      p2,
      btn_text
    );

    res.status(200).json({
      message: "Reset Password Email sent",
    });
  } catch (error) {
    console.log(error);
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

// // reset password
export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;
  console.log("reset token:", resetToken);

  const hashedToken = Token.hashToken(resetToken);
  const userToken = await Token.findOne({
    rToken: hashedToken,
    expireAt: { $gt: Date.now() },
  });
  console.log(userToken);
  if (!userToken) {
    res.status(404);
    throw new Error("Invalid or expire token");
  }

  const user = await User.findOne({
    _id: userToken.userId,
  });

  user.password = password;
  await user.save();

  res.status(200).json({
    message: "your password has been changed",
  });
});

// // change password
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, password } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("please enter the old and new password");
  }

  const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);

  if (user && isPasswordCorrect) {
    user.password = password;
    await user.save();

    res.status(200).json({
      message: "your password has been changed, please re-login",
    });

    // send confirmation email
    const subject = "Password has been changed! ";
    const send_to = user.email;
    const sent_from = process.env.EMAIL_USER;
    const reply_to = "qasim@gmail.com";
    const template = "changePassword";
    const name = user.name;
    const link = "/";

    // send email
    try {
      await sendEmail(subject, send_to, sent_from, reply_to, template, {
        name,
        link,
      });
      res.status(200).json({
        message: "change Password Email sent",
      });
    } catch (error) {
      console.log(error);
      res.status(500);
      throw new Error("Email not sent, please try again");
    }
  } else {
    res.status(400).json({
      message: "old password is incorrect, please try again",
    });
  }
});
