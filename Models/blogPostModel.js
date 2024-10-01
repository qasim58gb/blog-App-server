import mongoose from "mongoose";

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  summary: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  image: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  access: {
    allowedEmails: [
      {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
    ],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Automatically update `updatedAt` on document updates
blogPostSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const BlogPost = mongoose.model("BlogPost", blogPostSchema);

export default BlogPost;
