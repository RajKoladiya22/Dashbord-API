"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkCreateCustomers = exports.bulkVerifyCustomers = void 0;
const csv_parser_1 = __importDefault(require("csv-parser"));
const exceljs_1 = __importDefault(require("exceljs"));
const database_config_1 = require("../../config/database.config");
const responseHandler_1 = require("../../core/utils/responseHandler");
const stream_1 = require("stream");
const bulkVerifyCustomers = async (req, res, next) => {
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
    const rows = [];
    const ext = (_a = req.file.originalname.split(".").pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    const errorCust = [];
    const problematicEmails = new Set();
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
                    rows.push({
                        companyName: ((_a = row.getCell(1).text) === null || _a === void 0 ? void 0 : _a.trim()) || "",
                        contactPerson: ((_b = row.getCell(2).text) === null || _b === void 0 ? void 0 : _b.trim()) || "",
                        mobileNumber: ((_c = row.getCell(3).text) === null || _c === void 0 ? void 0 : _c.trim()) || "",
                        email: ((_d = row.getCell(4).text) === null || _d === void 0 ? void 0 : _d.trim()) || "",
                        serialNo: ((_e = row.getCell(5).text) === null || _e === void 0 ? void 0 : _e.trim()) || "",
                        joiningDate: ((_f = row.getCell(6).text) === null || _f === void 0 ? void 0 : _f.trim()) || "",
                        address: ((_g = row.getCell(7).text) === null || _g === void 0 ? void 0 : _g.trim()) || ""
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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const mobileRegex = /^[0-9]{10}$/;
        const allEmails = rows.map((r) => r.email);
        const fileDuplicates = new Set();
        const seenInFile = new Set();
        for (const email of allEmails) {
            if (seenInFile.has(email)) {
                fileDuplicates.add(email);
            }
            else {
                seenInFile.add(email);
            }
            ;
        }
        const existingCustomers = await database_config_1.prisma.customer.findMany({
            where: { email: { in: [...seenInFile] } },
            select: { email: true }
        });
        const dbEmails = new Set(existingCustomers.map((c) => c.email));
        const data = rows.map((r) => {
            const errorMsg = { missing: [], invalid: [], duplicate: [] };
            let parsedDate = null;
            if (!r.companyName)
                errorMsg.missing.push("Company Name");
            if (!r.contactPerson)
                errorMsg.missing.push("Contact Person");
            if (!r.mobileNumber)
                errorMsg.missing.push("Mobile Number");
            if (!r.email)
                errorMsg.missing.push("Email");
            if (!r.serialNo)
                errorMsg.missing.push("Serial No");
            if (r.joiningDate) {
                const parsed = new Date(r.joiningDate.trim());
                if (!isNaN(parsed.getTime()))
                    parsedDate = parsed;
                else
                    errorMsg.invalid.push(`Joining Date (${r.joiningDate})`);
            }
            else {
                errorMsg.missing.push("Joining Date");
            }
            if (r.email && !emailRegex.test(r.email)) {
                errorMsg.invalid.push(`Email (${r.email})`);
            }
            if (r.mobileNumber && !mobileRegex.test(r.mobileNumber)) {
                errorMsg.invalid.push(`Mobile Number (${r.mobileNumber})`);
            }
            if (fileDuplicates.has(r.email)) {
                errorMsg.duplicate.push("Duplicate email in file");
            }
            if (dbEmails.has(r.email)) {
                errorMsg.duplicate.push("Email already exists in database");
            }
            if (errorMsg.missing.length || errorMsg.invalid.length || errorMsg.duplicate.length) {
                if (!problematicEmails.has(r.email)) {
                    problematicEmails.add(r.email);
                    const messages = [
                        errorMsg.missing.length ? `Missing: ${errorMsg.missing.join(", ")}` : "",
                        errorMsg.invalid.length ? `Invalid: ${errorMsg.invalid.join(", ")}` : "",
                        errorMsg.duplicate.length ? `Duplicate: ${errorMsg.duplicate.join(", ")}` : ""
                    ];
                    errorCust.push({
                        ...r,
                        missingFields: errorMsg.missing,
                        invalidFields: errorMsg.invalid,
                        duplicateReasons: errorMsg.duplicate
                    });
                }
            }
            return {
                companyName: r.companyName,
                contactPerson: r.contactPerson,
                mobileNumber: r.mobileNumber,
                email: r.email,
                serialNo: r.serialNo,
                joiningDate: parsedDate,
                address: r.address
            };
        });
        const validCustomers = data.filter((d) => !problematicEmails.has(d.email));
        (0, responseHandler_1.sendSuccessResponse)(res, 201, "Data after skipping duplicates", {
            errorRecords: errorCust,
            parseData: validCustomers
        });
    }
    catch (err) {
        console.error("Bulk Verify Customers error:", err.message || err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, err.message || "Failed to process file");
    }
};
exports.bulkVerifyCustomers = bulkVerifyCustomers;
const bulkCreateCustomers = async (req, res, next) => {
    try {
        const customers = req.body;
        const user = req.user;
        if (!user) {
            (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
            return;
        }
        const adminId = user.role === "admin" ? user.id : user.adminId;
        if (!Array.isArray(customers) || customers.length === 0) {
            (0, responseHandler_1.sendErrorResponse)(res, 400, "Please provide data");
            return;
        }
        const invalidRecords = customers.filter(cust => !cust.companyName ||
            !cust.contactPerson ||
            !cust.mobileNumber ||
            !cust.email ||
            !cust.serialNo ||
            !cust.joiningDate);
        if (invalidRecords.length > 0) {
            (0, responseHandler_1.sendErrorResponse)(res, 422, "Records are missing required fields", {
                invalidRecords,
            });
            return;
        }
        const data = customers.map((cust) => ({
            adminId: adminId,
            companyName: cust.companyName,
            contactPerson: cust.contactPerson,
            mobileNumber: cust.mobileNumber,
            email: cust.email,
            serialNo: cust.serialNo,
            joiningDate: new Date(cust.joiningDate),
            address: cust.address || "",
        }));
        const result = await database_config_1.prisma.customer.createMany({
            data,
            skipDuplicates: true,
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 201, "Customers created successfully", {
            createdCount: result.count,
        });
    }
    catch (error) {
        console.error("Bulk Create Customers error:", error.message || error);
        (0, responseHandler_1.sendErrorResponse)(res, 500, error.message || "Internal server error");
    }
};
exports.bulkCreateCustomers = bulkCreateCustomers;
//# sourceMappingURL=customer.bulk.controller.js.map