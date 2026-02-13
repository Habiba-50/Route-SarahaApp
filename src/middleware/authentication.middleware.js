import { TokenTypeEnum } from "../common/enums/security.enum.js"
import { forbiddenException } from "../common/utils/index.js"
import { decodeToken } from "../common/utils/security/token.security.js"


export const authentication = (tokenType = TokenTypeEnum.ACCESS) => {

    return async (req, res, next) => {
        
         if(!req?.headers?.authorization){
        throw badRequestException("Authorization header is required")
    }
        const user = await decodeToken(req.headers?.authorization, [tokenType])
        req.user = user
        next()
    }
}

export const authorization = (accessRoles = []) => {
    return async (req, res, next) => {
        console.log(req.user.role);
        if(!accessRoles.includes(req.user.role)){
            throw forbiddenException({message:"Unauthorized"})
        }
         
        next()
    }
}

// export const authorization = (accessRoles = [], tokenType = TokenTypeEnum.ACCESS) => {
//   return async (req, res, next) => {
//     if (!req?.headers?.authorization) {
//       throw BadRequestException({ message: "Missing authorization key" });
//     }

//     req.user = await decodeToken({ token: req.headers?.authorization., tokenType });
//     console.log(req.user.role);

//     if (!accessRoles.includes(req.user.role)) {
//       throw ForbiddenException({ message: "Not allowed account" });
//     }

//     next();
//   };
// };