import { compareHash, generateHash, generateOTP, sendOTPEmail } from "../common/utils/index.js";
import { userModel } from "./model/index.js";

// -----------------------------find----------------------------------
export const find = async ({
    filter,
    options = {},
    select,
    model } = {}) => {
  
    const doc = model.find(filter || {}).select(select || "");

  if (options.populate) {
    doc.populate(options.populate);
  }

  if (options.skip) {
    doc.skip(options.skip);
  }

  if (options.limit) {
    doc.limit(options.limit);
  }

  if (options.lean) {
    doc.lean(options.lean);
  }

  return await doc.exec();
};

// -----------------------------findById----------------------------------

export const findById = async ({ id, options= {}, select = "", model }) => {
  const doc = model.findById(id).select(select || "");

  if (options.populate) {
    doc.populate(options.populate);
  }

  if (options.lean) {
    doc.lean(options.lean);
  }

  return await doc.exec();
};

// -----------------------------findOne----------------------------------

export const findOne = async ({
  model,
  select = "",
  filter = {},
  options = {},
} = {}) => {
  const doc = model.findOne(filter);
  if (select.length) {
    doc.select(select);
  }
  if (options.populate) {
    doc.populate(populate);
  }
  if (options.lean) {
    doc.lean(); // to remove id
  }
  return await doc.exec();
};

// -----------------------------create----------------------------------

export const create = async ({
  model,
  data,
  options = {
    validateBeeforeSave: true,
  },
}) => {
  return await model.create(data, options);
};

// -----------------------------createOne----------------------------------

export const createOne = async ({
  model,
  data,
  options = {
    validateBeeforeSave: true,
  },
}) => {
  const [doc] = (await model.create(data, options)) || [];
  return doc;
};

// -----------------------------insertMany----------------------------------

export const insertMany = async ({
  data,
  model
})=>{
  return await model.insertMany(data);
};

// -----------------------------updateOne----------------------------------

export const updateOne = async ({
  filter,
  update,
  options,
  model
}= {}) => {
  return await model.updateOne(
    filter || {},
    { ...update, $inc: { _v: 1 } },
    options
  );
};

// -----------------------------findOneAndUpdate----------------------------------

export const findOneAndUpdate = async ({
  filter,
  update,
  options,
  model
}= {}) => {
  return await model.findOneAndUpdate(
    filter || {},
    { ...update, $inc: { __v: 1 } },
    {
      new: true,
      runValidators: true,
      ...options,
    }
  );
};

// -----------------------------findByIdAndUpdate----------------------------------

export const findByIdAndUpdate = async ({
  id,
  update,
  options = { new: true, runValidators: true },
  model
} = {}) => {
  return await model.findByIdAndUpdate(
    id,
    { ...update, $inc: { __v: 1 } },
    options
  );
};

// -----------------------------deleteOne----------------------------------

export const deleteOne = async ({
  filter,
  model
}) => {
  return await model.deleteOne(filter || {});
};

// -----------------------------deleteMany----------------------------------

export const deleteMany = async ({
  filter,
  model
}) => {
  return await model.deleteMany(filter || {});
};


// -----------------------------findOneAndDelete----------------------------------

export const findOneAndDelete = async ({
  filter,
  model
}) => {
  return await model.findOneAndDelete(filter || {});
};

// -----------------------------paginate----------------------------------


// -----------------------------verifyEmail---------------------------------------
export const toVerifyEmail = async (inputs) => {
  const { email, otp } = inputs;
  const user = await findOne({
    model: userModel,
    filter: { email },
    select: "email otpCode otpExpiresAt isVerified",
    options: {
      lean: true
    }
  });

  if (!user) {
    return notFoundException("Email not found");
  }

  console.log(otp,user.otpCode);
  
  
  const matched = await compareHash(otp, user.otpCode);
    if (!matched) {
      return notFoundException("Invalid OTP");
  }
  
  if (user.otpExpiresAt < Date.now() ) {
    return notFoundException("OTP expired");
  }
  // user.isVerified = true;
  // user.otpCode = null;
  // user.otpExpiresAt = null;

  await userModel.updateOne({
    isVerified: true,
    otpCode: null,
    otpExpiresAt: null
  });
  return user;
};

// ----------------------------Resend OTP--------------------------------

export const toResendOtp = async (email) => {
  const user = await findOne({
    model: userModel,
    filter: { email },
    select: "email",
    options: {
      lean: true,
    },
  });
  if (!user) {
    return notFoundException("Email not found");
  }
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await userModel.updateOne({
    otpCode: await generateHash(otp),
    otpExpiresAt: expiresAt,
  });
  await sendOTPEmail(email, otp);
  return user;
};


