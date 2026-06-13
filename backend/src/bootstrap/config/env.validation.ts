import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  SUPABASE_URL: Joi.string().uri().required(),
  SUPABASE_SERVICE_KEY: Joi.string().required(),
});
