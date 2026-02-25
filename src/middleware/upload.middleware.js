import multer from "multer";

import fs from "fs";
import path from "path";

const uploadPath = path.resolve("uploads");

// if (!fs.existsSync(uploadPath)) {
//   fs.mkdirSync(uploadPath);
// }

fs.mkdirSync(uploadPath, { recursive: true });


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});


const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed!"), false);
  }
};

export const uploadSingleFile = multer({
  storage,
  fileFilter,
   limits: { fileSize: 5 * 1024 * 1024 }, 
  // 1 KB => 1024 Byte
  // 1 MB => 1024 KB
  // 1024 * 1024 = 1MB
  // image size will be 5MB
});