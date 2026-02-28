import { ProviderEnum } from "../../common/enums/index.js";
import { userModel, findOne, createOne, toVerifyEmail, toResendOtp } from "../../DB/index.js";
import {conflictException,notFoundException} from "./../../common/utils/response/index.js";
import { compareHash, createLoginCredentials, decrypt, encrypt, generateHash, generateToken, getTokenSignature } from "../../common/utils/security/index.js";
import { generateOTP, sendOTPEmail } from "../../common/utils/security/index.js";
import {OAuth2Client} from 'google-auth-library';


// ----------------------------Signup--------------------------------

export const signup = async (inputs) => {
  const { userName, email, password , phone } = inputs;
  const checkUserExist = await findOne({
    model: userModel,
    filter: { email },
    select: "email",
    options: {
      //   populate : [{path:'lol'}]
      lean: true,
    },
  });
  console.log(checkUserExist);

  if (checkUserExist) {
    return conflictException("Email already exists");
  }

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const user = await createOne({
    model: userModel,
    data: [{
      userName,
      email,
      password: await generateHash(password),
      phone: encrypt(phone),
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

// ----------------------------Resend OTP--------------------------------

export const resendOtp = async (inputs) => {
  const { email } = inputs;
  const user = await toResendOtp( email );
  return user;
};

// -----------------------------Verify google account --------------------------------

const verifyGoogleAccount = async (idToken) => {
    const client = new OAuth2Client();

  const ticket = await client.verifyIdToken({
    idToken: idToken,
    audience: process.env.WEB_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  // console.log(payload);

  if (!payload?.email_verified) {
    return notFoundException("fail to verify this account with google");
  }

  return payload
}


// ----------------------------Signup Gmail--------------------------------

export const signupGmail = async (idToken, issuer) => {

  const payload = await verifyGoogleAccount(idToken)

  console.log(payload);

  const checkUser = await findOne({
    model: userModel,
    filter: { email: payload?.email },
  });

  // console.log(checkUser);

  if (checkUser) {
    if (checkUser.provider !== ProviderEnum.Google) {
      return conflictException("Account already exists with different provider");
    } else {
      const account = await loginGmail({idToken}, issuer);
      return {account , status:200}
    }
    
  }

   const newUser = await createOne({
    model: userModel,
    data: [{
      firstName: payload?.given_name,
      lastName: payload?.family_name,
      email: payload?.email,
      provider: ProviderEnum.Google,
      profilePic: payload?.picture,
      isVerified: true,
      confirmEmail: new Date()
    }],
  });
  console.log(newUser);

  return await createLoginCredentials({ user: newUser, issuer });
};

// -----------------------------Login-------------------------------

export const login = async (inputs, issuer) => {
  const { email, password } = inputs;
  const user = await findOne({
    model: userModel,
    filter: { email },
    // select:'-password'
  });
  if (!user) {
    return notFoundException("Invalid login credentials");
  }
  // if (!user.isVerified) {
  //   return notFoundException("Please verify your email first");
  // }
  const matched = await compareHash(password, user.password);
  if (!matched) {
    return notFoundException("Invalid login credentials");
  }


  return await createLoginCredentials({ user, issuer });
};


// -----------------------------Login Gmail-------------------------------

export const loginGmail = async (idToken, issuer) => {

  const payload = await verifyGoogleAccount(idToken)

  const user = await findOne({
    model: userModel,
    filter: { email: payload?.email,provider: ProviderEnum.Google },
  });

  if (!user?.provider === ProviderEnum.Google) {
    throw conflictException("Account already exists with different provider");
    }


  return await createLoginCredentials({ user: checkUser, issuer });
};