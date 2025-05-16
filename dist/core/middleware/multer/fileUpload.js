"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter: (_req, file, cb) => {
        const allowed = [".csv", ".xls", ".xlsx"];
        cb(null, allowed.includes(file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase()));
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});
//# sourceMappingURL=fileUpload.js.map