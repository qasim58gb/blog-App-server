import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import * as dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localfilePath) => {
  try {
    if (!localfilePath) return null;
    // console.log(localfilePath);
    const response = await cloudinary.uploader.upload(localfilePath, {
      resource_type: "auto",
    });
    // console.log(response);
    fs.unlinkSync(localfilePath);
    return response;
  } catch (error) {
    console.log(error);
    fs.unlinkSync(localfilePath);
    return null;
  }
};
export default uploadOnCloudinary;
