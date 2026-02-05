import { ProviderEnum } from "../../common/enums/index.js";
import { userModel, findOne, createOne, toVerifyEmail } from "../../DB/index.js";
import {conflictException,notFoundException} from "./../../common/utils/response/index.js";
import { compareHash, decrypt, encrypt, generateHash } from "../../common/utils/security/index.js";
import {generateOTP, sendOTPEmail} from "../../common/utils/security/index.js";

// ----------------------------Signup--------------------------------

export const signup = async (inputs) => {
  const { userName, email, password , phone} = inputs;
  const checkUserExise = await findOne({
    model: userModel,
    filter: { email },
    select: "email",
    options: {
      //   populate : [{path:'lol'}]
      lean: true,
    },
  });
  console.log(checkUserExise);

  if (checkUserExise) {
    return conflictException("Email already exists");
  }

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const user = await createOne({
    model: userModel,
    data: [{
      userName,
      email,
      password: await generateHash(password),
      phone: await encrypt(phone),
      provider: ProviderEnum.System,
      otpCode: await generateHash(otp),
      otpExpiresAt: expiresAt,
    }],
  });
  await sendOTPEmail(email, otp);
  return user;
};

// ----------------------------Verify Email--------------------------------

export const verifyEmail = async (inputs) => {
  const { email, otp } = inputs;
  const user = await toVerifyEmail({ email, otp });
  return user;
};

// -----------------------------Login-------------------------------

export const login = async (inputs) => {
  const { email, password } = inputs;
    const user = await findOne({
        model: userModel,
        filter: { email },
        // select:'-password'
    });
  if (!user) {
    return notFoundException("Invalid login credentials");
  }
  const matched = await compareHash(password, user.password);
  if (!matched) {
    return notFoundException("Invalid login credentials");
  }
  user.phone = await decrypt(user.phone)
  // console.log(user.phone);
  
  return user;
};
