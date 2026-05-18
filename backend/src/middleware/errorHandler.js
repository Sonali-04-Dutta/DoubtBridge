import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    console.error("Internal error:", err);
  }

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    details: err.details || null
  });
};

export const notFound = (_req, _res, next) => {
  next(new ApiError(404, "Route not found"));
};