import Joi from "joi";
import { generalValidationFields } from "../../common/validation.js";


export const login = {
  body: Joi.object()
    .keys({
      email: generalValidationFields.email.required(),
      password: generalValidationFields.password.required(),
    })
    .required(),
};

export const signup = {
  body: login.body
    .append({
      userName: generalValidationFields.userName.required(),
      confirmPassword: generalValidationFields
        .confirmPassword("password")
        .required(),
      phone: generalValidationFields.phone.required(),
    })
    .required(),
};
  

export const emailAndOTP = {
  body: Joi.object().keys({
    email: generalValidationFields.email.required(),
    otp: generalValidationFields.otp.required(),
  }),
};  

export const email = {
  body: Joi.object().keys({
    email: generalValidationFields.email.required(),
  })
}

export const resetPassword = {
  body: login.body
    .append({
      confirmPassword: generalValidationFields
        .confirmPassword("password")
        .required(),
    })
    .required(),
};
    
  