const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const ApiError = require("./ApiError");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (localFilePath, folder = "Gargi") => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder,
    });

    fs.unlinkSync(localFilePath); // delete local file after upload
    return response;
  } catch (error) {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.error("Cloudinary upload error:", error);
    throw new ApiError(400, `Cloudinary upload failed: ${error.message}`);
  }
};

const destroyCloudImage = async (publicId) => {
  try {
    if (!publicId) return null;
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary destroy error:", error);
    throw new ApiError(400, `Cloudinary destroy failed: ${error.message}`);
  }
};

module.exports = {
  uploadToCloudinary,
  destroyCloudImage,
};
