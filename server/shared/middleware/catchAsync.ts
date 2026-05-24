import { Request, Response, NextFunction } from 'express';

// We use <T> to allow any version of the Request object
export const catchAsync = <T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: T, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};