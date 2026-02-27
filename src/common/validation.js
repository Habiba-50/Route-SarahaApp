import joi from "joi";
import { Types } from "mongoose";

export const generalValidationFields = {
    userName: joi.string()
      .pattern(new RegExp(/^[A-Z]{1}[a-z]{1,24}\s[A-Z]{1}[a-z]{1,24}$/)),
    
     phone: joi.string()
    .pattern(new RegExp(/^(02|2|\+2)?01[0-25]\d{8}$/)),
     
    confirmPassword: (matchedPath) => {
        return joi.string()
    .valid(joi.ref(matchedPath))
    .messages({
      'any.only': 'Passwords do not match'
    })
    },
   
    email: joi.string()
          .email({
            minDomainSegments: 2, // by default 2
            maxDomainSegments: 3, 
            tlds: { allow: ["com", "net", "edu"] },
          }),
        
    password: joi.string()
              .pattern(new RegExp(/^(?=.*[a-z]){1,}(?=.*[A-Z]){1,}(?=.*\d){1,}(?=.*\W)[\w\W\d].{8,25}$/)),
    
    id: joi.string().custom((value, helper)=> {
        return Types.ObjectId.isValid(value) ? value : helper.message("Invalid user ID")
    })
}