//AppError class create our own custome smart error object (message, statusCode)
import { IAppError } from "../../sec/types/AppError.types.js";
class AppError extends Error implements IAppError {
    
    public statusCode: number;
    public status: string;

    constructor(message: string, statusCode: number) {
        super(message);

        this.statusCode = statusCode;
        //if stsus error is 4xx (400/404/401/... ) its 'fail'  (client side), else 'error' (server side)
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        //a list of every file and line number the code went through before it crashed.
        Error.captureStackTrace(this, this.constructor);
    }
}
export default AppError;