import { randomUUID } from "node:crypto";
import pinoHttp from "pino-http";
import logger from "../config/logger.js";

const requestLogger = pinoHttp({
  logger,

  genReqId(req, res) {
    const requestId = randomUUID();
    res.setHeader("X-Request-ID", requestId);
    return requestId;
  },

  customLogLevel(req, res, err) {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },

  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        // Exclude query strings to avoid logging sensitive URL values.
        url: req.url?.split("?")[0],
        remoteAddress: req.remoteAddress,
      };
    },

    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});

export { requestLogger };
