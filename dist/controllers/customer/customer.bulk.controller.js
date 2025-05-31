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
    const user = req.user;
    if (!user) {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const adminId = user.role === "admin" ? user.id : user.adminId;
    const rows = [];
    const ext = (_a = req.file.originalname.split(".").pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
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
        else if (ext === "xlsx" || ext === "xls") {
            const workbook = new exceljs_1.default.Workbook();
            await workbook.xlsx.load(req.file.buffer);
            workbook.eachSheet((sheet) => {
                sheet.eachRow((row, rowNumber) => {
                    var _a, _b, _c, _d, _e, _f, _g;
                    if (rowNumber === 1)
                        return;
                    const companyName = ((_a = row.getCell(1).text) === null || _a === void 0 ? void 0 : _a.trim()) || "";
                    const contactPerson = ((_b = row.getCell(2).text) === null || _b === void 0 ? void 0 : _b.trim()) || "";
                    const mobileNumber = ((_c = row.getCell(3).text) === null || _c === void 0 ? void 0 : _c.trim()) || "";
                    const email = ((_d = row.getCell(4).text) === null || _d === void 0 ? void 0 : _d.trim()) || "";
                    const serialNo = ((_e = row.getCell(5).text) === null || _e === void 0 ? void 0 : _e.trim()) || "";
                    const joiningDate = ((_f = row.getCell(6).text) === null || _f === void 0 ? void 0 : _f.trim()) || undefined;
                    const address = ((_g = row.getCell(7).text) === null || _g === void 0 ? void 0 : _g.trim()) || "";
                    rows.push({
                        companyName,
                        contactPerson,
                        mobileNumber,
                        email,
                        serialNo,
                        joiningDate,
                        address
                    });
                });
            });
        }
        else {
            (0, responseHandler_1.sendErrorResponse)(res, 400, "Unsupported file type");
            return;
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
        const supportedDateFormats = [
            "yyyy-MM-dd",
            "dd/MM/yyyy",
            "MM/dd/yyyy",
            "dd-MM-yyyy",
            "MMM dd, yyyy",
        ];
        const data = rows.map((r, i) => {
            let parsedDate = new Date();
            if (r.joiningDate) {
                const dateStr = r.joiningDate.trim();
                let validDate = null;
                for (const format of supportedDateFormats) {
                    const parsed = (0, date_fns_1.parse)(dateStr, format, new Date());
                    if (!isNaN(parsed.getTime())) {
                        validDate = parsed;
                        break;
                    }
                }
                if (!validDate) {
                    throw new Error(`Invalid joining date at row ${i + 2}`);
                }
                parsedDate = validDate;
            }
            return {
                adminId: adminId,
                companyName: r.companyName,
                contactPerson: r.contactPerson,
                mobileNumber: r.mobileNumber,
                email: r.email,
                serialNo: r.serialNo,
                joiningDate: parsedDate,
                address: r.address,
            };
        });
        console.log(data);
        const result = await database_config_1.prisma.$transaction([
            database_config_1.prisma.customer.createMany({
                data,
                skipDuplicates: true,
            }),
        ]);
        console.log("-------------------???????", result, "length", result.length);
        if (result.length >= 1 && result[0].count > 0) {
            (0, responseHandler_1.sendSuccessResponse)(res, 201, "Bulk customers created", {
                count: result[0].count,
            });
        }
        else {
            (0, responseHandler_1.sendErrorResponse)(res, 500, "Failed to create customers");
        }
    }
    catch (err) {
        console.error("bulkCreateCustomers error:", err.message || err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, err.message || "Failed to process file");
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