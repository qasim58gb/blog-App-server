import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import userRouter from "./Routes/userRouter.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import messageRouter from "./Routes/messageRouter.js";
import blogRouter from "./Routes/blogRouter.js";

dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();

// Middleware setup
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());

app.use("/api/users", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/blogs", blogRouter);
// app.use("/api/generateImage", generateImageRoutes);

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;
  res.status(statusCode);

  res.json({
    message: err.message,
    stack: process.env.NODE_ENV == "development" ? err.stack : null,
  });
};

app.use(errorHandler);

// app.listen(PORT, () => {
//   console.log(`App is runing on ${PORT}`);
// });

mongoose
  .connect(process.env.MONGODB_URL, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    // serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`App is runing on ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
