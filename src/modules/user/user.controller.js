import { Router } from "express";
import {  rotateToken, AddProfileImage, shareProfile } from "./user.service.js";
import { authentication, authorization } from "../../middleware/authentication.middleware.js";
import { successResponse } from "../../common/utils/response/success.respone.js";
import { RoleEnum } from "../../common/enums/user.enum.js";
import { TokenTypeEnum } from "../../common/enums/security.enum.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from "./user.validation.js"
// import { localFileUpload } from "../../common/utils/multer/index.js";

    const router=Router()

// router.get("/" ,authentication(), authorization([RoleEnum.User]), async (req,res,next)=>{
//     const result = await profile(req.user)
    
//     return successResponse(res, 200, { result })
// })


router.get("{/:userId/share-profile}",
    authentication(), authorization([RoleEnum.User, RoleEnum.Admin]),
    validation(validators.shareProfile), async (req, res, next) => {
        // console.log({user : req.user, param : req.params.userId});
        
        const result = await shareProfile(req.user, req.params.userId)
        // console.log(result);
        
       return successResponse(res, 200, { result })
})

router.get("/rotate-token" ,authentication(TokenTypeEnum.REFRESH), authorization([RoleEnum.User]), async (req,res,next)=>{
    const result = await rotateToken(req.user, `${req.protocol}://${req.host}`)
    
    return successResponse(res, 200, { result })
})


// router.patch("/profile-image", authentication(), authorization([RoleEnum.User]), localFileUpload.single("attachement"), async (req, res, next) => {
//     const result = await AddProfileImage(req.user, req.file);
//     return successResponse(res, 200, { result });
// });

export default router




