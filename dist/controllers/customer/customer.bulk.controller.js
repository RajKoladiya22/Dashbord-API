"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkCreateCustomers = void 0;
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const exceljs_1 = __importDefault(require("exceljs"));
const database_config_1 = require("../../config/database.config");
const responseHandler_1 = require("../../core/utils/responseHandler");
const date_fns_1 = require("date-fns");
const stream_1 = require("stream");
const bulkCreateCustomers = async (req, res, next) => {
    var _a;
    if (!req.file) {
        (0, responseHandler_1.sendErrorResponse)(res, 400, "No file uploaded");
        return;
    }
    const rows = [];
    const ext = (_a = req.file.originalname.split(".").pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    const user = req.user;
    if (!user) {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const adminId = user.role === "admin" ? user.id : user.adminId;
    try {
        if (ext === "csv") {
            const stream = stream_1.Readable.from(req.file.buffer);
            await new Promise((resolve, reject) => {
                stream
                    .pipe((0, csv_parser_1.default)())
                    .on("data", (row) => rows.push(row))
                    .on("end", () => resolve())
                    .on("error", (err) => reject(err));
            });
        }
        else {
            const workbook = new exceljs_1.default.Workbook();
            if (ext === "xls") {
                await workbook.xlsx.load(req.file.buffer);
            }
            else {
                await workbook.xlsx.load(req.file.buffer);
            }
            workbook.eachSheet((sheet) => {
                sheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1)
                        return;
                    if (!Array.isArray(row.values)) {
                        return;
                    }
                    const cells = row.values;
                    const [companyName, contactPerson, mobileNumber, email, serialNo] = cells.slice(1).map((v) => String(v !== null && v !== void 0 ? v : "").trim());
                    rows.push({
                        companyName,
                        contactPerson,
                        mobileNumber,
                        email,
                        serialNo,
                    });
                });
            });
        }
        if (!rows.length) {
            (0, responseHandler_1.sendErrorResponse)(res, 400, "File contains no data");
            return;
        }
        for (const [i, r] of rows.entries()) {
            if (!r.companyName ||
                !r.contactPerson ||
                !r.mobileNumber ||
                !r.email ||
                !r.serialNo) {
                (0, responseHandler_1.sendErrorResponse)(res, 422, `Missing field at row ${i + 2}`);
                return;
            }
        }
        const data = rows.map((r) => ({
            adminId: adminId,
            companyName: r.companyName,
            contactPerson: r.contactPerson,
            mobileNumber: r.mobileNumber,
            email: r.email,
            serialNo: r.serialNo,
            address: {},
            joiningDate: r.joiningDate ? (0, date_fns_1.parseISO)(r.joiningDate) : new Date(),
        }));
        const result = await database_config_1.prisma.$transaction([
            database_config_1.prisma.customer.createMany({
                data,
                skipDuplicates: false,
            }),
        ]);
        (0, responseHandler_1.sendSuccessResponse)(res, 201, "Bulk customers created", {
            count: result[0].count,
        });
    }
    catch (err) {
        console.error("bulkCreateCustomers error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Failed to process file");
    }
    finally {
        if (req.file && typeof req.file.path === "string") {
            fs_1.default.unlink(req.file.path, (err) => {
                if (err)
                    console.warn("Failed to delete temp file:", err);
            });
        }
    }
};
exports.bulkCreateCustomers = bulkCreateCustomers;
//# sourceMappingURL=customer.bulk.controller.js.map