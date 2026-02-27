import { Router } from "express";
import { profile, rotateToken, shareProfile } from "./user.service.js";
import { authentication, authorization } from "../../middleware/authentication.middleware.js";
import { successResponse } from "../../common/utils/response/success.respone.js";
import { RoleEnum } from "../../common/enums/user.enum.js";
import { TokenTypeEnum } from "../../common/enums/security.enum.js";
import { localFileUpload } from "../../common/utils/multer/index.js";
import * as validators from "./user.validation.js";
import { validation } from "../../middleware/validation.middleware.js";
    const router=Router()

router.get("/profile" ,authentication(), authorization([RoleEnum.User]), async (req,res,next)=>{
    const result = await profile(req.user)
    
    return successResponse(res, 200, { result })
})

router.get("/:userId/share-profile",validation(validators.shareProfile),async (req, res, next) => {
    const result = await shareProfile(req.params.userId);

    return successResponse(res, 200, { result });
  },
);

router.patch("/profile-image", authentication(), authorization([RoleEnum.User]), localFileUpload().single("attachment"), async (req, res, next) => {
    // const result = await AddProfileImage(req.user, req.file);
    return successResponse(res, 200, { data:req.file });
});


router.get("/rotate-token" ,authentication(TokenTypeEnum.REFRESH), authorization([RoleEnum.User]), async (req,res,next)=>{
    const result = await rotateToken(req.user, `${req.protocol}://${req.host}`)
    return successResponse(res, 200, { result })
})



export default router




