"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("./logger");
function errorHandler(err, req, res, next) {
    logger_1.logger.error(`${req.method} ${req.url} — ${err.message}`);
    res.status(err.status || 500).json({ message: 'Internal Server Error', error: err.message });
}
//# sourceMappingURL=errorHandler.js.map