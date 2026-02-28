import { NODE_ENV } from "../../../../config/config.service.js";
import multer from "multer";

// Fixed error structure for global error handling
export const globalErrorHandling = (error, req, res, next) => {
  const status = error.cause?.status ?? 500;
  const mood = NODE_ENV == "production";
  const defaultErrorMessage = "something went wrong Server error";
  const displayErrorMessage = error.message || defaultErrorMessage;
  // if (error instanceof multer.MulterError) {
  //   // console.log("Multer error:", error);
  //   status = 400; // Bad Request for Multer errors
  //  }

  return res.status(status).json({
    status: error instanceof multer.MulterError ? 400 : status,
    errorMessage: mood
      ? status == 500
        ? defaultErrorMessage
        : undefined
      : displayErrorMessage,
    extra: error.cause?.extra,
    stack: mood ? undefined : error.stack,
  });
};

// ----------------------------------------------

// general customized error method 
export const ErrorException = ({ message = "Error", status = 400 , extra = undefined } = {}) => {
  throw new Error(message, { cause: { status, extra } });
};

// ----------------------------------------------


// Error-templates

// 1
export const notFoundException = (message = "Not Found Exception",status = 404, extra = undefined  ) => {
  return ErrorException({ message, status, extra  });
};


// 2
export const unauthorizedException = ({ message = "Unauthorized Exception", extra = undefined } = {}) => {
  return ErrorException({ message, status: 401, extra  });
}

// 3
export const badRequestException = ({ message = "Bad Request Exception", extra = undefined } = {}) => {
  return ErrorException({ message, status: 400, extra  });
}

//4
export const forbiddenException = ({ message = "Forbidden Exception", extra = undefined } = {}) => {
  return ErrorException({ message, status: 403, extra  });
}

//5
export const conflictException = (message = "Conflict Exception", extra ={} ) => {
  return ErrorException({ message, status: 409, extra  });
}