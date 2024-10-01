import asyncHandler from "express-async-handler";
import BlogPost from "../Models/blogPostModel.js";
import User from "../Models/userModel.js";
import uploadOnCloudinary from "../Utils/uploadCloudinary.js";

// create blog
export const createBlogPost = asyncHandler(async (req, res) => {
  const { title, category, summary, content } = req.body;
  const _id = req.user._id;

  if (!title || !category || !summary || !content) {
    res.status(400);
    throw new Error("Please fill in all the inputs");
  }

  let coverImageLocalPath = req.files?.coverImage[0]?.path;
  // console.log(coverImageLocalPath);

  if (!coverImageLocalPath) {
    res.status(400);
    throw new Error("Cover image file is requried");
  }
  // for  optional
  // let coverImageLocalPath;
  // if (
  //   req.files &&
  //   Array.isArray(req.files.coverImage) &&
  //   req.files.coverImage.length > 0
  // ) {
  //   coverImageLocalPath = req.files.coverImage[0].path;
  // }

  const user = await User.findById(_id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.role === "suspended") {
    res.status(401);
    throw new Error("Suspended user Not authorized to post a blog.");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  let coverImageUrl = coverImage.secure_url;

  if (!coverImageUrl) {
    res.status(500);
    throw new Error(
      "something is wrong while uploading cover image, Please try again"
    );
  }

  // for optional
  // let coverImageUrl = "";
  // if (coverImageLocalPath) {
  //   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  //   coverImageUrl = coverImage?.url || "";
  //   if (coverImageUrl) {
  //     res.send("image upload");
  //   }
  // }

  const superAdmins = await User.find({ role: "superAdmin" });

  // console.log(superAdmins);
  const superAdminEmails = superAdmins.map((admin) => admin.email);
  const allowedEmails = [user.email, ...superAdminEmails];

  console.log(allowedEmails);

  const uniqueAllowedEmails = Array.from(new Set(allowedEmails));
  console.log(uniqueAllowedEmails);

  const newBlogPost = await BlogPost.create({
    title,
    category,
    summary,
    image: coverImageUrl,
    content,
    userId: _id,
    access: {
      allowedEmails: uniqueAllowedEmails,
    },
  });

  if (newBlogPost) {
    console.log(newBlogPost);
    res
      .status(201)
      .json({ message: "Blog post created successfully", post: newBlogPost });
  } else {
    throw new Error("Something went wrong. Please try again.");
  }
});

// give access to other user
export const giveAccess = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const userId = req.user._id;
  const { blogId } = req.params;

  if (!email) {
    res.status(400);
    throw new Error("Email is required.");
  }

  const sanitizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: sanitizedEmail });

  if (!user) {
    res.status(404);
    throw new Error("User with this email does not exist.");
  }

  if (user.role === "suspended") {
    res.status(401);
    throw new Error("Suspended user Not authorized.");
  }

  // Find the blog post by its ID
  const blog = await BlogPost.findById(blogId);

  // Check if blog post exists
  if (!blog) {
    res.status(404);
    throw new Error("Blog not found.");
  }

  // Compare user IDs as strings
  const requestingUser = await User.findById(userId);
  if (
    requestingUser.toString() !== blog.userId.toString() &&
    requestingUser.role !== "superAdmin"
  ) {
    res.status(401);
    throw new Error("Not authorized to modify this blog.");
  }

  // Check if the email is already in the allowedEmails array
  if (blog.access.allowedEmails.includes(sanitizedEmail)) {
    res
      .status(400)
      .json({ message: `This ${sanitizedEmail} already has access.` });
    throw new Error("This email already has access.");
  }

  // Add the new email to the allowedEmails array
  blog.access.allowedEmails.push(sanitizedEmail);

  // Save the updated blog post
  await blog.save();

  // Send a success response
  res.status(200).json({
    message: `Access granted to ${sanitizedEmail}`,
    blog: blog,
  });
});

// remove the access of other user
export const removeAccess = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const userId = req.user._id;
  const { blogId } = req.params;

  if (!email) {
    res.status(400);
    throw new Error("Email is required.");
  }

  const sanitizedEmail = email.trim().toLowerCase();

  // Check if the user by email
  const user = await User.findOne({ email: sanitizedEmail });
  if (!user) {
    res.status(404).json({
      message: "User with this email does not exist.",
    });
    throw new Error("User with this email does not exist.");
  }

  if (user.role === "suspended") {
    res.status(401);
    throw new Error("Suspended user Not authorized.");
  }

  // Find the blog post by its ID
  const blog = await BlogPost.findById(blogId);
  if (!blog) {
    res.status(404).json({
      message: "Blog not found.",
    });
    throw new Error("Blog not found.");
  }

  // Ensure the authenticated user is the owner of the blog
  const requestingUser = await User.findById(userId);
  if (
    requestingUser.toString() !== blog.userId.toString() &&
    requestingUser.role !== "superAdmin"
  ) {
    res.status(401).json({
      message: "Not authorized to modify this blog.",
    });
    throw new Error("Not authorized to modify this blog.");
  }

  const blogOwner = await User.findById(blog.userId);
  if (blogOwner.email === sanitizedEmail || user.role === "superAdmin") {
    res.status(400).json({
      message:
        "Cannot remove the blog owner's email or an Super admin's email.",
    });
    throw new Error(
      "Cannot remove the blog owner's email or an Super admin's email."
    );
  }

  // Check if the email exists in the allowedEmails array
  const emailIndex = blog.access.allowedEmails.indexOf(sanitizedEmail);

  if (emailIndex === -1) {
    res.status(400).json({
      message: "This email does not have access.",
    });
    throw new Error("This email does not have access.");
  }

  // Remove the email from the allowedEmails array
  blog.access.allowedEmails.splice(emailIndex, 1);

  // Save the updated blog post
  await blog.save();

  // Send a success response
  res.status(200).json({
    message: `Access revoked for ${sanitizedEmail}`,
    blog: blog,
  });
});

// get blogs
export const getBlogs = asyncHandler(async (req, res) => {
  const userEmail = req.user.email;

  if (!userEmail) {
    res.status(400);
    throw new Error("Email is required.");
  }

  const sanitizedEmail = userEmail.trim().toLowerCase();
  const blogs = await BlogPost.find({ "access.allowedEmails": sanitizedEmail });

  if (!blogs || blogs.length === 0) {
    res.status(404);
    throw new Error("No blog posts found with access for this email.");
  }

  res.status(200).json({
    message: `Blog posts retrieved for email: ${sanitizedEmail}`,
    blogs,
  });
});

export const getClientBlogs = asyncHandler(async (req, res) => {
  const blogs = await BlogPost.find();

  if (!blogs || blogs.length === 0) {
    res.status(404).json({ message: "No blog posts found." });
    return;
  }

  res.status(200).json({
    blogs,
  });
});

// del the blog
export const deleteBlogPost = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { blogId } = req.params;

  // check the blog
  const blog = await BlogPost.findById(blogId);
  if (!blog) {
    res.status(404);
    throw new Error("Blog not found.");
  }

  // check the user
  const requestingUser = await User.findById(userId);
  if (!requestingUser) {
    res.status(404);
    throw new Error("user not found.");
  }

  if (requestingUser.role === "suspended") {
    res.status(401);
    throw new Error("Suspended user Not authorized.");
  }

  // Ensure the user is either the blog owner or a super admin
  if (
    requestingUser._id.toString() !== blog.userId.toString() &&
    requestingUser.role !== "superAdmin"
  ) {
    res.status(401);
    throw new Error("Not authorized to delete this blog.");
  }

  await BlogPost.deleteOne(blog._id);

  res.status(200).json({
    message: "Blog post deleted successfully",
  });
});

// update the blog
// export const updateBlogPost = asyncHandler(async (req, res) => {
//   const { blogId } = req.params;
//   const userId = req.user._id;
//   const { title, category, summary, content } = req.body;

//   // check user by id
//   const user = await User.findById(userId);
//   if (!user) {
//     res.status(404);
//     throw new Error("User not found.");
//   }
//   // check blog by id
//   const blog = await BlogPost.findById(blogId);
//   if (!blog) {
//     res.status(404);
//     throw new Error("Blog not found.");
//   }

//   // checl user is authorized to update this blog
//   const sanitizedEmail = user.email.trim().toLowerCase();
//   if (!blog.access.allowedEmails.includes(sanitizedEmail)) {
//     res.status(401);
//     throw new Error("Not authorized to update this blog.");
//   }

//   // for  optional coverImage
//   let coverImageLocalPath;
//   if (
//     req.files &&
//     Array.isArray(req.files.coverImage) &&
//     req.files.coverImage.length > 0
//   ) {
//     coverImageLocalPath = req.files.coverImage[0].path;
//   }

//   console.log(coverImageLocalPath);

//   let coverImageUrl = "";
//   if (coverImageLocalPath) {
//     const coverImage = await uploadOnCloudinary(coverImageLocalPath);

//     coverImageUrl = coverImage?.secure_url || "";
//     console.log(coverImageUrl);
//     if (coverImageUrl) {
//       res.send("image is update");
//     }
//   }

//   // Update the blog fields if provided in the request body
//   blog.title = title || blog.title;
//   blog.category = category || blog.category;
//   blog.summary = summary || blog.summary;
//   blog.image = coverImageUrl || blog.image;
//   blog.content = content || blog.content;

//   // Save the updated blog post
//   const updatedBlogPost = await blog.save();

//   // Send a success response with the updated blog post
//   res.status(200).json({
//     message: "Blog post updated successfully",
//     blog: updatedBlogPost,
//   });
// });

export const updateBlogPost = asyncHandler(async (req, res) => {
  const { blogId } = req.params;
  const userId = req.user._id;
  const { title, category, summary, content } = req.body;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  if (user.role === "suspended") {
    res.status(401);
    throw new Error("Suspended user Not authorized.");
  }

  // Check if blog post exists
  const blog = await BlogPost.findById(blogId);
  if (!blog) {
    res.status(404);
    throw new Error("Blog not found.");
  }

  // Check if the user is authorized to update the blog
  const sanitizedEmail = user.email.trim().toLowerCase();
  if (!blog.access.allowedEmails.includes(sanitizedEmail)) {
    res.status(401);
    throw new Error("You are not authorized to update this blog.");
  }

  // Handle optional coverImage update
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  let coverImageUrl = blog.image; // Default to existing image URL
  if (coverImageLocalPath) {
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    coverImageUrl = coverImage?.secure_url || blog.image; // Update only if a new URL is available
  }

  // Update the blog fields if provided in the request body
  blog.title = title || blog.title;
  blog.category = category || blog.category;
  blog.summary = summary || blog.summary;
  blog.image = coverImageUrl;
  blog.content = content !== undefined ? content : blog.content;

  // Save the updated blog post
  const updatedBlogPost = await blog.save();

  // Send a success response with the updated blog post
  res.status(200).json({
    message: "Blog post updated successfully",
    blog: updatedBlogPost,
  });
});
