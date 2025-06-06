/* // src/controllers/customer/customer.bulk.controller.ts
import { Request, Response, NextFunction } from "express";
import fs from "fs";
import csv from "csv-parser";
import ExcelJS from "exceljs";
import { prisma } from "../../config/database.config";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/responseHandler";
import { parseISO } from "date-fns";
import { Readable } from "stream";

interface Row {
  companyName: string;
  contactPerson: string;
  mobileNumber: string;
  email: string;
  serialNo: string;
  joiningDate?: string;
}

export const bulkCreateCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.file) {
    sendErrorResponse(res, 400, "No file uploaded");
    return;
  }

  const rows: Row[] = [];
  const ext = req.file.originalname.split(".").pop()?.toLowerCase();

  const user = req.user;
  if (!user) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }
  const adminId = user.role === "admin" ? user.id : user.adminId!;
  // const partnerId = user.role === "partner" ? user.id : incomingPartnerId;

  try {
    if (ext === "csv") {
      const stream = Readable.from(req.file.buffer);
      await new Promise<void>((resolve, reject) => {
        stream
          .pipe(csv())
          .on("data", (row) => rows.push(row))
          .on("end", () => resolve())
          .on("error", (err) => reject(err));
      });
    } else {
      // Excel parsing via exceljs 
      const workbook = new ExcelJS.Workbook();
      if (ext === "xls") {
        await workbook.xlsx.load(req.file.buffer);
      } else {
        await workbook.xlsx.load(req.file.buffer);
      }
      workbook.eachSheet((sheet) => {
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // skip header
          

          // 1) Guard that values exist and are an array
          if (!Array.isArray(row.values)) {
            // e.g. empty row; skip or throw
            return;
          }
          // 2) Now TS knows row.values is CellValue[]
          const cells = row.values as ExcelJS.CellValue[];

          // 3) Destructure your five columns (skip the leading null)
          const [companyName, contactPerson, mobileNumber, email, serialNo] =
            cells.slice(1).map((v) => String(v ?? "").trim());

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
      sendErrorResponse(res, 400, "File contains no data");
      return;
    }

    // Validate required fields presence
    for (const [i, r] of rows.entries()) {
      if (
        !r.companyName ||
        !r.contactPerson ||
        !r.mobileNumber ||
        !r.email ||
        !r.serialNo
      ) {
        sendErrorResponse(res, 422, `Missing field at row ${i + 2}`);
        return;
      }
    }

    // Map to Prisma data, parse optional dates
    const data = rows.map((r) => ({
      adminId: adminId,
      companyName: r.companyName,
      contactPerson: r.contactPerson,
      mobileNumber: r.mobileNumber,
      email: r.email,
      serialNo: r.serialNo,
      address: {},
      joiningDate: r.joiningDate ? parseISO(r.joiningDate) : new Date(),
    }));

    // Bulk insert with createMany inside transaction :contentReference[oaicite:7]{index=7}
    const result = await prisma.$transaction([
      prisma.customer.createMany({
        data,
        skipDuplicates: false,
      }),
    ]);

    sendSuccessResponse(res, 201, "Bulk customers created", {
      count: result[0].count,
    });
  } catch (err: any) {
    console.error("bulkCreateCustomers error:", err);
    sendErrorResponse(res, 500, "Failed to process file");
  } finally {
    if (req.file && typeof req.file.path === "string") {
      fs.unlink(req.file.path, (err) => {
        if (err) console.warn("Failed to delete temp file:", err);
      });
    }
  }
};*/
// src/controllers/customer/customer.bulk.controller.ts
import { Request, Response, NextFunction } from "express";
import fs from "fs";
import csv from "csv-parser";
import ExcelJS from "exceljs";
import { prisma } from "../../config/database.config";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/responseHandler";
import { parseISO } from "date-fns";
import { Readable } from "stream";

interface Row {
  companyName: string;
  contactPerson: string;
  mobileNumber: string;
  email: string;
  serialNo: string;
  joiningDate?: string;
}

export const bulkCreateCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.file) {
    sendErrorResponse(res, 400, "No file uploaded");
    return;
  }

  const rows: Row[] = [];
  const ext = req.file.originalname.split(".").pop()?.toLowerCase();

  try {
    if (ext === "csv") {
      const stream = Readable.from(req.file.buffer);
      await new Promise<void>((resolve, reject) => {
        stream
          .pipe(csv())
          .on("data", (row) => rows.push(row))
          .on("end", () => resolve())
          .on("error", (err) => reject(err));
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);

      workbook.eachSheet((sheet) => {
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // skip header

          const companyName = row.getCell(1).text?.trim() || "";
          const contactPerson = row.getCell(2).text?.trim() || "";
          const mobileNumber = row.getCell(3).text?.trim() || "";
          const email = row.getCell(4).text?.trim() || "";
          const serialNo = row.getCell(5).text?.trim() || "";
          const joiningDate = row.getCell(6).text?.trim() || undefined;

          rows.push({
            companyName,
            contactPerson,
            mobileNumber,
            email,
            serialNo,
            joiningDate,
          });
        });
      });
    } else {
      sendErrorResponse(res, 400, "Unsupported file type");
      return;
    }

    if (!rows.length) {
      sendErrorResponse(res, 400, "File contains no data");
      return;
    }

    for (const [i, r] of rows.entries()) {
      if (
        !r.companyName ||
        !r.contactPerson ||
        !r.mobileNumber ||
        !r.email ||
        !r.serialNo
      ) {
        sendErrorResponse(res, 422, `Missing field at row ${i + 2}`);
        return;
      }
    }

    const data = rows.map((r, i) => {
      let parsedDate = new Date();
      if (r.joiningDate) {
        try {
          parsedDate = parseISO(r.joiningDate);
          if (isNaN(parsedDate.getTime())) {
            throw new Error(`Invalid date at row ${i + 2}`);
          }
        } catch {
          throw new Error(`Invalid joining date at row ${i + 2}`);
        }
      }

      return {
        companyName: r.companyName,
        contactPerson: r.contactPerson,
        mobileNumber: r.mobileNumber,
        email: r.email,
        serialNo: r.serialNo,
        joiningDate: parsedDate,
      };
    });

    const result = await prisma.$transaction([
      prisma.customer.createMany({
        data,
        skipDuplicates: true,
      }),
    ]);

    sendSuccessResponse(res, 201, "Bulk customers created", {
      count: result[0].count,
    });
  } catch (err: any) {
    console.error("bulkCreateCustomers error:", err.message || err);
    sendErrorResponse(res, 500, err.message || "Failed to process file");
  } finally {
    if (req.file && typeof req.file.path === "string") {
      fs.unlink(req.file.path, (err) => {
        if (err) console.warn("Failed to delete temp file:", err);
      });
    }
  }
};    
