import { NODE_ENV } from "../../../../config/config.service.js";

// Fixed error structure for global error handling
export const globalErrorHandling = (error, req, res, next) => {
  const status = error.cause?.status ?? 500;
  const mood = NODE_ENV == "production";
  const defaultErrorMessage = "something went wrong Server error";
  const displayErrorMessage = error.message || defaultErrorMessage;
  return res.status(status).json({
    status,
    errorMessage: mood ? (status == 500 ? defaultErrorMessage : undefined) : displayErrorMessage,
      extra: error.cause?.extra,
      stack: mood ? undefined : error.stack,
      
  });
};

// ----------------------------------------------

// general customized error method 
export const ErrorExeption = ({ message = "Error", status = 400 , extra = undefined } = {}) => {
  throw new Error(message, { cause :{status , extra} });
};

// ----------------------------------------------


// Error-templates

// 1
export const notFoundException = (message = "Not Found Exception", extra = undefined  ) => {
  return ErrorExeption({ message, status: 404, extra  });
};


// 2
export const unauthorizedException = ({ message = "Unauthorized Exception", extra = undefined } = {}) => {
  return ErrorExeption({ message, status: 401, extra  });
}

// 3
export const badRequestException = ({ message = "Bad Request Exception", extra = undefined } = {}) => {
  return ErrorExeption({ message, status: 400, extra  });
}

//4
export const forbiddenException = ({ message = "Forbidden Exception", extra = undefined } = {}) => {
  return ErrorExeption({ message, status: 403, extra  });
}

//5
export const conflictException = (message = "Conflict Exception", extra ={} ) => {
  return ErrorExeption({ message, status: 409, extra  });
}