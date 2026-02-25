import Joi from "joi";
import { generalValidationFields } from "../../common/validation.js";


// export const signup = Joi.object()
//   .keys({
//     userName: Joi.string()
//       .pattern(new RegExp(/^[A-Z]{1}[a-z]{1,24}\s[A-Z]{1}[a-z]{1,24}$/))
//       .required(),
    
//     email: Joi.string()
//       .email({
//         minDomainSegments: 2, // by default 2
//         maxDomainSegments: 3,
//         tlds: { allow: ["com", "net", "edu"] },
//       })
//       .required(),
    
//     password: Joi.string()
//           .pattern(new RegExp(/^(?=.*[a-z]){1,}(?=.*[A-Z]){1,}(?=.*\d){1,}(?=.*\W)[\w\W\d].{8,25}$/,))
//           .required(),
    
//     confirmPassword: Joi.string()
//     .valid(Joi.ref('password'))
//     .messages({
//       'any.only': 'Passwords do not match'
//     })
//       .required(),
    
//     // confirmPassword: joi.ref("password").required() ✖✖✖
    
//     phone: Joi.string()
//     .pattern(new RegExp(/^(02|2|\+2)?01[0-25]\d{8}$/))
//     .required(),
    
//     // /^(02|2|\+2)?01[0125][0-9]{8}$/
    
//     })
//   .required();



const login = {
  body: Joi.object().keys({
    email: generalValidationFields.email.required(),
    password: generalValidationFields.password.required(),
  }).required()
};



export const signup = {

  body: login.body.append({
    userName: generalValidationFields.userName.required(),
    confirmPassword: generalValidationFields.confirmPassword('password').required(),
    phone: generalValidationFields.phone.required(),
  }).required(),

}
  

  
  