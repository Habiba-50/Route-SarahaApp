import multer from "multer"


export const localFileUpload = () => {
    
    return multer({dest:"/temp"})
}

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