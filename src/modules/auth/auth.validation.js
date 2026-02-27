import Joi from "joi";
import { generalValidationFields } from "../../common/validation.js";


const login = {
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
  

  
  