// logger.js
const { createLogger, format, transports } = require("winston");
const path = require("path");

const enableLogging = process.env.ENABLE_LOGGING === "true"; // check env

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.json()
  ),
  transports: enableLogging
    ? [
        new transports.File({
          filename: path.join(__dirname, "api-logs.log"),
          level: "info"
        })
      ]
    : [] // no transports if logging disabled
});

module.exports = logger;
