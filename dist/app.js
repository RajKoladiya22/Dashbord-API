"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const requestLogger_1 = require("./core/middleware/logs/requestLogger");
const errorHandler_1 = require("./core/middleware/logs/errorHandler");
const v1_1 = __importDefault(require("./routes/v1"));
const checkStaticToken_1 = require("./core/middleware/key/checkStaticToken");
require("./core/job/planStatus");
const app = (0, express_1.default)();
const corsOptions = {
    origin: ["http://localhost:5173", "https://dashbord-seven-sigma.vercel.app"],
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use(requestLogger_1.requestLogger);
app.use(checkStaticToken_1.checkStaticToken);
app.use((0, cookie_parser_1.default)());
app.use("/api/v1", v1_1.default);
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map