// logResponse.js
const logger = require("./logger");

function logResponse(req, res, next) {
  if (!logger.transports.length) {
    return next(); // skip if logging disabled
  }

  const oldSend = res.send;

  res.send = function (data) {
    try {
      const responseData = JSON.parse(data);
      logger.info({
        route: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        response: responseData
      });
    } catch (err) {
      logger.info({
        route: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        response: data
      });
    }
    return oldSend.apply(res, arguments);
  };

  next();
}

module.exports = logResponse;
