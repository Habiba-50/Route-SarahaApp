import joi from "joi";
import { generalValidationFields } from "../../common/validation.js";
import { fileFieldValidation } from "../../common/utils/index.js";

export const shareProfile = {
  params: joi
    .object()
    .keys({
      userId: generalValidationFields.id,
    })
    .required(),
};

export const profileImage = {
  file: generalValidationFields.file(fileFieldValidation.image).required(),
};

export const profileCoverImage = {
  files: joi
    .array()
    .items(generalValidationFields.file(fileFieldValidation.image).required())
    .min(1)
    .max(5)
    .required(),
};


export const password = {
  body: joi
    .object().keys({
      oldPassword: generalValidationFields.password.required(),
      newPassword: generalValidationFields.password.not(joi.ref("oldPassword")).required(),
      confirmNewPassword: generalValidationFields.confirmPassword("newPassword").required()
      // To be sure that the new password is not the same as the old password
      // and to be sure that the new password is the same as the confirm new password
    })
}