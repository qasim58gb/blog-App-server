import express from "express";
import {
  createBlogPost,
  deleteBlogPost,
  getBlogs,
  getClientBlogs,
  giveAccess,
  removeAccess,
  updateBlogPost,
} from "../Controllers/blogPostController.js";
import { protect } from "../Middleware/authMiddleware.js";
import upload from "../Middleware/multerMiddleware.js";
const router = express.Router();

router.post(
  "/postBlog",
  protect,
  upload.fields([
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  createBlogPost
);
router.post("/giveAccess/:blogId", protect, giveAccess);
router.post("/removeAccess/:blogId", protect, removeAccess);
router.get("/getBlogs", protect, getBlogs);
router.get("/getClientBlogs", getClientBlogs);
router.delete("/deleteBlog/:blogId", protect, deleteBlogPost);
router.patch(
  "/updateBlog/:blogId",
  protect,
  upload.fields([
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  updateBlogPost
);

export default router;
