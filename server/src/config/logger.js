import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),

  base: {
    service: "getheva-hotel-api",
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  // Never intentionally log credentials or tokens.
  redact: {
    paths: [
      "password",
      "passwordHash",
      "accessToken",
      "refreshToken",
      "resetToken",
      "verificationToken",
      "authorization",
      "cookie",
      "smtpPass",
    ],
    censor: "[REDACTED]",
  },

  // Readable logs locally; structured JSON in production.
  ...(!isProduction && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),
});

export default logger;
