

export const fileFieldValidation = {
  image: ["image/jpeg", "image/png", "image/jpg"],
  video: ["video/mp4"],
};

export const fileFilter = (validation = []) => {
   
    return function (req, file, cb) {
       console.log(file);
    if (!validation.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file formate"),
        { cause: { statusCode: 400 } },
        false,
      );
      }
     
  };
};
