import multer from "multer";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { fileFilter } from "./validation.multer.js";

export const localFileUpload = ({
  customPath = "general",
  validation = [],
  maxSize = 5  // 5MB

} = {}) => {

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const fullPath = resolve(`../uploads/${customPath}`)
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath , {recursive:true})
      }
      cb(null, resolve(fullPath));
    },

    filename: function (req, file, cb) {
      const uniqueName = randomUUID() + "-" + file.originalname;
      file.finalPath = `uploads/${customPath}/${uniqueName}`
      cb(null, uniqueName);
      // file.originalname => name of the file on the user's computer + extension
    },
  });
  
  return multer({
    fileFilter: fileFilter(validation),
    storage,
    limits: {
      fileSize: maxSize * 1024 * 1024  // bytes
    } 
   });
};

// 5 mg * 1024 => kb 
// 5 mg * 1024 * 1024 => bytes

// const uploadPath = path.resolve("uploads");

// // if (!fs.existsSync(uploadPath)) {
// //   fs.mkdirSync(uploadPath);
// // }

// fs.mkdirSync(uploadPath, { recursive: true });

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/");
//   },
//   filename: function (req, file, cb) {
//     const uniqueName = Date.now() + "-" + file.originalname;
//     cb(null, uniqueName);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only images are allowed!"), false);
//   }
// };

// export const uploadSingleFile = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 },
// });
