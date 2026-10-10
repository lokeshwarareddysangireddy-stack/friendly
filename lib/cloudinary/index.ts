import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function configure() {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 8 * 1024 * 1024;

export function validateImageFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPEG, PNG, WEBP or AVIF images are allowed.";
  }
  if (file.size > MAX_BYTES) {
    return "Image must be smaller than 8 MB.";
  }
  return null;
}

export async function uploadImage(
  file: File,
  folder = "friendlybasket"
): Promise<{ url: string; publicId: string }> {
  const error = validateImageFile(file);
  if (error) throw new Error(error);
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }
  configure();
  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (err, result) => {
        if (err || !result) {
          reject(err || new Error("Upload failed"));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  if (!publicId || !isCloudinaryConfigured()) return;
  configure();
  await cloudinary.uploader.destroy(publicId);
}
