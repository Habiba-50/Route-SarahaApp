import { badRequestException } from "../common/utils/index.js";
import { signup } from "../modules/auth/auth.validation.js";



export const validation = (schema) => {
    return (req, res, next) => {
        const errors = [];
        
        if (!schema) {
             return next();
        }

        const keys = Object.keys(schema);
        for (const key of keys) {
            const validationResult = schema[key].validate(req[key], { abortEarly: false });
            if (validationResult.error) {
                console.log("Validation error", validationResult.error.details)
                errors.push(...validationResult.error.details.map(detail => ({
                    message: detail.message,
                    path: [key, ...detail.path]
                })));
            }
        }

        if (errors.length > 0) {
            console.log("Validation error", errors)
            return next(badRequestException({ message: "Validation error", extra: errors }));
        }

        next();
    };
};