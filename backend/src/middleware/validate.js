import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

export const validate = (schema) => (req, _res, next) => {
  const parsed = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query
  });

  if (!parsed.success) {
    return next(new ApiError(400, "Validation error", parsed.error.flatten()));
  }

  req.validated = parsed.data;
  return next();
};

export const schemas = {
  signup: z.object({
    body: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(5),
      role: z.enum(["student", "teacher"])
    }),
    params: z.object({}),
    query: z.object({})
  }),
  login: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(5)
    }),
    params: z.object({}),
    query: z.object({})
  }),
  forgotPassword: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(5)
    }),
    params: z.object({}),
    query: z.object({})
  }),
  googleLogin: z.object({
    body: z.object({
      idToken: z.string().min(10),
      role: z.enum(["student", "teacher"]).optional()
    }),
    params: z.object({}),
    query: z.object({})
  })
};
