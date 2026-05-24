import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';

type RequestLocation = 'body' | 'query' | 'params';
export const validate = (schema: Schema, property: RequestLocation = "body") => {
  return (req: Request, res: Response, next: NextFunction) => {

    const input = req[property];
    const { error, value } = schema.validate(input, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {

      const errors = error.details.map((err) => ({
        field: err.path.join("."),
        message: err.message
      }));

      return res.status(422).json({
        status: 422,
        message: "Validation error",
        data: errors
      });
    }

    req[property] = value; // replace body with the validated & cleaned value
    next();
  };
};