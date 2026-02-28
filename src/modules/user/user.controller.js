import { Router } from "express";
import { deleteProfileImage, logout, profile, profileCoverImage, profileImage, rotateToken, shareProfile, uploadProfileImage } from "./user.service.js";
import { authentication, authorization } from "../../middleware/authentication.middleware.js";
import { successResponse } from "../../common/utils/response/success.respone.js";
import { RoleEnum } from "../../common/enums/user.enum.js";
import { TokenTypeEnum } from "../../common/enums/security.enum.js";
import { fileFieldValidation, localFileUpload } from "../../common/utils/multer/index.js";
import * as validators from "./user.validation.js";
import { validation } from "../../middleware/validation.middleware.js";
    const router=Router()

router.post("/logout", authentication(), async (req, res, next) => { 
    const status = await logout(req.body, req.user , req.decoded);
    return successResponse(res, status, { message: "Logged out successfully" });
})

router.get("/profile" ,authentication(), authorization([RoleEnum.User]), async (req,res,next)=>{
    const result = await profile(req.user)
    
    return successResponse(res, 200, { result })
})

router.get("/:userId/share-profile",validation(validators.shareProfile),async (req, res, next) => {
    const result = await shareProfile(req.params.userId);

    return successResponse(res, 200, { result });
  },
);

router.patch("/profile-image",
    authentication(),
    localFileUpload({
        customPath: "users/profile",
        validation: [fileFieldValidation.image, fileFieldValidation.video],
        maxSize: 5
    }).single("attachment"),
    validation(validators.profileImage) ,
    async (req, res, next) => {

    const account = await profileImage(req.file, req.user);
    return successResponse(res, 200, { account });
});

router.patch("/profile-cover-image",
    authentication(),
    localFileUpload({
        customPath: "users/profile/cover",
        validation: [fileFieldValidation.image],
        maxSize: 5
    }).array("attachments", 2),
    validation(validators.profileCoverImage),
    async (req, res, next) => {
   
    const account = await profileCoverImage(req.files, req.user);
    return successResponse(res, 200, { data : {files: req.files} } );
});

// router.patch(
//   "/profile-documents-image",
//   authentication(),
//   localFileUpload({
//     customPath: "users/profile/documents",
//     validation: [fileFieldValidation.image],
//     maxSize: 10,
//   }).fields([
//     { name: "nationalID", maxCount: 2 },
//     { name: "graduation certificate", maxCount: 1 },
//   ]),
//   async (req, res, next) => {
//     // const account = await profileCoverImage(req.files, req.user);
//     return successResponse(res, 200, { data: { files: req.files } });
//   },
// );

router.delete("/profile-image", authentication(), async (req, res, next) => {
    await deleteProfileImage(req.user , req.body);
    return successResponse(res, 200, { message: "Profile picture deleted successfully" });
})
 
// ----------------------------------------------------------------------------

// Upload a new image and move the old one to gallery 
router.patch(
  "/upload-profile-image",
  authentication(),
  localFileUpload({
    customPath: "users/profile",
    validation: [fileFieldValidation.image, fileFieldValidation.video],
    maxSize: 5,
  }).single("attachment"),
  validation(validators.profileImage),
  async (req, res, next) => {
    const account = await uploadProfileImage(req.file, req.user);
    return successResponse(res, 200, { account });
  },
);

// ------------------------------------------------------------------------------

router.post("/rotate-token" ,authentication(TokenTypeEnum.REFRESH), authorization([RoleEnum.User]), async (req,res,next)=>{
    const credentials = await rotateToken(req.user, req.decoded,`${req.protocol}://${req.host}`)
    return successResponse(res, 200, { credentials })
})



export default router




