import logger from "../config/logger.js";

const errorHandler = (err, req, res, next) => {
  const candidateStatus = err.statusCode ?? err.status;

  const statusCode =
    Number.isInteger(candidateStatus) &&
    candidateStatus >= 400 &&
    candidateStatus <= 599
      ? candidateStatus
      : 500;

  // Log unexpected server errors with diagnostic details.
  // Expected 4xx responses are logged by pino-http.
  if (statusCode >= 500) {
    logger.error(
      {
        err,
        requestId: req.id,
        method: req.method,
        path: req.originalUrl?.split("?")[0],
      },
      "Unhandled request error",
    );
  }

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? "Internal server error"
        : err.message || "Request failed",
  });
};

export { errorHandler };
