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
import { parse } from "date-fns";
import { Readable } from "stream";

interface Row {
  companyName: string;
  contactPerson: string;
  mobileNumber: string;
  email: string;
  serialNo: string;
  joiningDate?: string;
  address: string
}

interface errorMSG {
  invalid: string[];
  missing: string[];
  duplicate: string[];
}

export const bulkVerifyCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.file) {
    sendErrorResponse(res, 400, "No file uploaded");
    return;
  }

  const user = req.user;
  if (!user) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }

  // const adminId = user.role === "admin" ? user.id : user.adminId!;
  const rows: Row[] = [];
  const ext = req.file.originalname.split(".").pop()?.toLowerCase();
  const errorCust: any[] = [];
  const problematicEmails = new Set<string>();

  try {

    // file is uploaded, now process it
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
          if (rowNumber === 1) return;
          rows.push({
            companyName: row.getCell(1).text?.trim() || "",
            contactPerson: row.getCell(2).text?.trim() || "",
            mobileNumber: row.getCell(3).text?.trim() || "",
            email: row.getCell(4).text?.trim() || "",
            serialNo: row.getCell(5).text?.trim() || "",
            joiningDate: row.getCell(6).text?.trim() || "",
            address: row.getCell(7).text?.trim() || ""
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[0-9]{10}$/;

    const allEmails = rows.map((r) => r.email);
    const fileDuplicates = new Set<string>();
    const seenInFile = new Set<string>();
    for (const email of allEmails) {
      if (seenInFile.has(email)) { 
        fileDuplicates.add(email); 
      }
      else { 
        seenInFile.add(email) 
      };
    }

    const existingCustomers = await prisma.customer.findMany({
      where: { email: { in: [...seenInFile] } },
      select: { email: true }
    });
    const dbEmails = new Set(existingCustomers.map((c) => c.email));

    const data = rows.map((r) => {
      const errorMsg: errorMSG = { missing: [], invalid: [], duplicate: [] };
      let parsedDate: Date | null = null;

      if (!r.companyName) errorMsg.missing.push("companyName");
      if (!r.contactPerson) errorMsg.missing.push("contactPerson");
      if (!r.mobileNumber) errorMsg.missing.push("mobileNumber");
      if (!r.email) errorMsg.missing.push("email");
      if (!r.serialNo) errorMsg.missing.push("serialNo");

      if (r.joiningDate) {
        const parsed = new Date(r.joiningDate.trim());
        if (!isNaN(parsed.getTime())) parsedDate = parsed;
        else errorMsg.invalid.push(`joiningDate`);
      } else {
        errorMsg.missing.push("joiningDate");
      }

      if (r.email && !emailRegex.test(r.email)) {
        errorMsg.invalid.push(`email`);
      }

      if (r.mobileNumber && !mobileRegex.test(r.mobileNumber)) {
        errorMsg.invalid.push(`mobileNumber`);
      }

      if (fileDuplicates.has(r.email)) {
        errorMsg.duplicate.push("Duplicate email in file");
      }

      if (dbEmails.has(r.email)) {
        errorMsg.duplicate.push("Email already exists in your database");
      }

      if (errorMsg.missing.length || errorMsg.invalid.length || errorMsg.duplicate.length) {
        if (!problematicEmails.has(r.email)) {

          problematicEmails.add(r.email);
          const messages = [
            errorMsg.missing.length ? `Missing: ${errorMsg.missing.join(", ")}` : "",
            errorMsg.invalid.length ? `Invalid: ${errorMsg.invalid.join(", ")}` : "",
            errorMsg.duplicate.length ? `Duplicate: ${errorMsg.duplicate.join(", ")}` : ""
          ]

          // errorCust.push({ ...r, errorMsg: messages });
          errorCust.push({
            ...r,
            missingFields: errorMsg.missing,
            invalidFields: errorMsg.invalid,
            duplicateReasons: errorMsg.duplicate
          });
        }
      }

      return {
        // adminId,
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

    sendSuccessResponse(res, 201, "Data after skipping duplicates", {
      errorRecords: errorCust,
      parseData: validCustomers
    });
  } catch (err: any) {
    console.error("Bulk Verify Customers error:", err.message || err);
    sendErrorResponse(res, 500, err.message || "Failed to process file");
  }
};


export const bulkCreateCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customers = req.body;

    const user = req.user;
  if (!user) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }

    const adminId = user.role === "admin" ? user.id : user.adminId!;

    if (!Array.isArray(customers) || customers.length === 0) {
      sendErrorResponse(res, 400, "Please provide data");
      return;
    }

    const invalidRecords = customers.filter(cust =>
      !cust.companyName ||
      !cust.contactPerson ||
      !cust.mobileNumber ||
      !cust.email ||
      !cust.serialNo ||
      !cust.joiningDate
    );

    if (invalidRecords.length > 0) {
      sendErrorResponse(res, 422, "Records are missing required fields", {
        invalidRecords,
      });
      return;
    }

    const data = customers.map((cust: any) => ({
      adminId: adminId,
      companyName: cust.companyName,
      contactPerson: cust.contactPerson,
      mobileNumber: cust.mobileNumber,
      email: cust.email,
      serialNo: cust.serialNo,
      joiningDate: new Date(cust.joiningDate),
      address: cust.address || "",
    }));

    const result = await prisma.customer.createMany({
      data,
      skipDuplicates: true,
    });

    sendSuccessResponse(res, 201, "Customers created successfully", {
      createdCount: result.count,
    });
  } catch (error: any) {
    console.error("Bulk Create Customers error:", error.message || error);
    sendErrorResponse(res, 500, error.message || "Internal server error");
  }
};