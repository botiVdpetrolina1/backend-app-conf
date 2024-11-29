
import { RequestHandler } from "express";
import {Schema, ValidationError } from "yup";


type TProperty = 'body' | 'header' | 'params' | 'query';

type TGetSchema = <T>(schema: Schema<T>) => Schema<T>;

type TAllSchemas = Record<TProperty, Schema<any>>;

type TGetAllSchemas = (getSchema: TGetSchema) => Partial<TAllSchemas>; // partial diz que nem todos campos são obrigatorios

type TValidation = (getAllSchemas: TGetAllSchemas) => RequestHandler;

export const validation: TValidation = (getAllSchemas) => async (req, res, next): Promise<void | string | any> => {


  const schemas = getAllSchemas((schema) => schema);

  const errorsResult: Record<string, Record<string, string>> = {};

  Object.entries(schemas).forEach(([key, schema]) => {

    try {
      schema.validateSync(req[key as TProperty], {abortEarly: false});
    } catch (err) {
      const yupError = err as ValidationError;
      const errors: Record<string, string> = {};
      
      yupError.inner.forEach(error => {
        if(error.path === undefined) return;
        errors[error.path] = error.message
      })

            
      errorsResult[key] = errors;
    }
    
  });

  if (Object.entries(errorsResult).length === 0) {
    return next();
  } else {
    return res.status(400).json({ errors: errorsResult });
  }
  };