

export const fileFieldValidation = {
  image: ["image/jpeg", "image/png", "image/jpg"],
  video: ["video/mp4"],
};

export const fileFilter = (validation = []) => {
  const flatValidation = validation.flat();
  return function (req, file, cb) {
    console.log(file);
    if (flatValidation.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file formate", { cause: { status: 400 } }),
        false,
      );
    }
  };
};
