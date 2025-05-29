// src/controllers/customer/customer.controller.ts

import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.config";
import { parseISO } from "date-fns";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/responseHandler";
import { UpdateCustomerBody, updateCustomerSchema } from "../../core/utils/zod";
import { Prisma } from "@prisma/client";
import { addMonths, addYears } from "../../core/utils/helper/dateHelpers";

export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const {
    companyName,
    contactPerson,
    mobileNumber,
    email,
    serialNo,
    prime = false,
    blacklisted = false,
    remark,
    hasReference = false,
    partnerId: incomingPartnerId,
    adminCustomFields,
    address,
    joiningDate,
    products = [],
  } = req.body;

  // Determine adminId & partnerId based on logged‑in user
  const user = req.user;
  if (!user) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }
  const adminId = user.role === "admin" ? user.id : user.adminId!;
  const partnerId = user.role === "partner" ? user.id : incomingPartnerId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1) Create the customer
      const customer = await tx.customer.create({
        data: {
          adminId,
          partnerId,
          companyName,
          contactPerson,
          mobileNumber,
          email,
          serialNo,
          prime,
          blacklisted,
          remark,
          hasReference,
          adminCustomFields,
          address,
          joiningDate: parseISO(joiningDate),
        },
      });
      // console.log("customer----->\n", customer);

      // 2) Create history entries for each product
      let history: Array<any> = [];
      const now = new Date();
      if (products) {
        const historyCreates = products.map((p) => {
          const purchase = new Date(p.purchaseDate);
          let renewalDate: Date | undefined;
          let expiryDate: Date | undefined;

          switch (p.renewPeriod) {
            case "monthly":
              renewalDate = addMonths(purchase, 1);
              expiryDate = new Date(renewalDate);
              expiryDate.setDate(expiryDate.getDate() - 1);
              break;

            case "quarterly":
              renewalDate = addMonths(purchase, 3);
              expiryDate = new Date(renewalDate);
              expiryDate.setDate(expiryDate.getDate() - 1);
              break;

            case "half_yearly":
              renewalDate = addMonths(purchase, 6);
              expiryDate = new Date(renewalDate);
              expiryDate.setDate(expiryDate.getDate() - 1);
              break;

            case "yearly":
              renewalDate = addYears(purchase, 1);
              expiryDate = new Date(renewalDate);
              expiryDate.setDate(expiryDate.getDate() - 1);
              break;

            case "custom":
            default:
              // For custom, trust the incoming values (if any)
              renewalDate = p.renewalDate ? new Date(p.renewalDate) : undefined;
              expiryDate = p.expiryDate ? new Date(p.expiryDate) : undefined;
              break;
          }

          return tx.customerProductHistory.create({
            data: {
              customerId: customer.id,
              adminId,
              productId: p.productDetailId,
              purchaseDate: purchase,
              status: true,
              renewPeriod: p.renewPeriod,
              renewal: p.renewal ?? false,
              renewalDate,
              expiryDate,
            },
          });
        });
        history = await Promise.all(historyCreates);
      }

      return { customer, history };
    });

    const sanitized = {
      ...result.customer,
      product: result.history,
    };

    // Return the created customer and its history
    sendSuccessResponse(res, 201, "Customer created", {
      customer: sanitized,
    });
    return;
  } catch (err: any) {
    // Unique violation on mobile/email
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      sendErrorResponse(res, 409, "Mobile number or email already in use");
      return;
    }
    // Foreign key violation on partnerId
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2003"
    ) {
      sendErrorResponse(res, 400, "Invalid partnerId");
      return;
    }
    console.error("createCustomer error:", err);
    if (!res.headersSent) next(err);
    sendErrorResponse(res, 500, "Server error");
    return;
  }
};

export const listCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;
  if (!user) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }

  // Pagination
  const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit as string, 10) || 10, 1),
    100
  );
  const skip = (page - 1) * limit;

  // Search
  const q = (req.query.q as string)?.trim();
  const searchFilter = q
    ? {
        OR: [
          { companyName: { contains: q, mode: "insensitive" } },
          { contactPerson: { contains: q, mode: "insensitive" } },
          { mobileNumber: { contains: q, mode: "insensitive" } },
          { serialNo: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  // Sorting
  const allowedSortFields = [
    "companyName",
    "contactPerson",
    "mobileNumber",
    "serialNo",
  ];
  const sortBy = (req.query.sortBy as string) || "companyName";
  const sortOrder =
    (req.query.sortOrder as string)?.toLowerCase() === "desc" ? "desc" : "asc";

  if (!allowedSortFields.includes(sortBy)) {
    sendErrorResponse(
      res,
      400,
      `Invalid sortBy. Must be one of: ${allowedSortFields.join(", ")}`
    );
    return;
  }

  // New: optional status filter
  let statusFilter = { status: true };
  if (req.query.status === "false") {
    statusFilter.status = false;
  }

  // Base filter by role
  const baseFilter: any = { ...searchFilter, ...statusFilter };
  switch (user.role) {
    case "admin":
    case "super_admin":
      baseFilter.adminId = user.id;
      break;
    case "partner":
      baseFilter.adminId = user.adminId!;
      baseFilter.partnerId = user.id;
      break;
    case "team_member":
    case "sub_admin":
      baseFilter.adminId = user.adminId!;
      break;
    default:
      sendErrorResponse(res, 403, "Forbidden");
      return;
  }

  try {
    const [total, customers] = await Promise.all([
      prisma.customer.count({ where: baseFilter }),
      prisma.customer.findMany({
        where: baseFilter,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          partner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
              contactInfo: true,
              email: true,
              address: true,
              status: true,
            },
          },
          history: {
            // take: 1,
            include: {
              product: {
                select: {
                  id: true,
                  productName: true,
                  productPrice: true,
                  status: true,
                },
              },
              renewals: {
                select: {
                  id: true,
                  purchaseDate: true,
                  renewalDate: true,
                  expiryDate: true,
                },
                orderBy: { purchaseDate: "desc" },
              },
            },
          },
        },
      }),
    ]);

    const sanitized = customers.map((cust) => ({
      id: cust.id,
      companyName: cust.companyName,
      contactPerson: cust.contactPerson,
      mobileNumber: cust.mobileNumber,
      email: cust.email,
      serialNo: cust.serialNo,
      prime: cust.prime,
      blacklisted: cust.blacklisted,
      remark: cust.remark,
      address: cust.address,
      adminCustomFields: cust.adminCustomFields,
      joiningDate: cust.joiningDate,
      hasReference: cust.hasReference,
      status: cust.status,
      partner: cust.partner,
      createdAt: cust.createdAt,
      product: cust.history.map((h) => ({
        productDetails: h.product,
        id: h.id,
        renewPeriod: h.renewPeriod,
        purchaseDate: h.purchaseDate,
        expiryDate: h.expiryDate,
        renewalDate: h.renewalDate,
        renewal: h.renewal,
        status: h.status,
        history: h.renewals ?? null,
      })),
    }));

    // 6) Return paginated response
    sendSuccessResponse(res, 200, "Customers fetched", {
      customers: sanitized,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("listCustomers error:", err);
    sendErrorResponse(res, 500, "Server error");
  }
};

export const updateCustomer = async (
  req: Request<{ id: string }, {}, UpdateCustomerBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const customerId = req.params.id;

  // 2) Validate request body
  const parsed = updateCustomerSchema.safeParse(req.body);
  // console.log("customerId---->", customerId);
  // console.log("parsed---->", parsed);

  if (!parsed.success) {
    console.error("Validation failed with errors: ", parsed.error.errors);
    sendErrorResponse(res, 400, "Invalid input", {
      errors: parsed.error.errors,
    });
    return;
  }
  const { product, ...customerData } = parsed.data;

  // 3) Determine adminId from the authenticated user
  const user = req.user as { id: string; role: string; adminId?: string };
  if (!user) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }
  const adminId = user.role === "admin" ? user.id : user.adminId!;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 4) Update only the customer record
      const updatedCustomer = await tx.customer.update({
        where: {
          id: customerId,
          adminId,
        },
        data: {
          ...(customerData.companyName !== undefined && {
            companyName: customerData.companyName,
          }),
          ...(customerData.contactPerson !== undefined && {
            contactPerson: customerData.contactPerson,
          }),
          ...(customerData.mobileNumber !== undefined && {
            mobileNumber: customerData.mobileNumber,
          }),
          ...(customerData.email !== undefined && {
            email: customerData.email,
          }),
          ...(customerData.serialNo !== undefined && {
            serialNo: customerData.serialNo,
          }),
          ...(customerData.prime !== undefined && {
            prime: customerData.prime,
          }),
          ...(customerData.blacklisted !== undefined && {
            blacklisted: customerData.blacklisted,
          }),
          ...(customerData.remark !== undefined && {
            remark: customerData.remark,
          }),
          ...(customerData.hasReference !== undefined && {
            hasReference: customerData.hasReference,
          }),
          ...(customerData.partnerId !== undefined && {
            partnerId: customerData.partnerId,
          }),
          ...(customerData.adminCustomFields !== undefined && {
            adminCustomFields: customerData.adminCustomFields,
          }),
          ...(customerData.address !== undefined && {
            address: customerData.address,
          }),
          ...(customerData.joiningDate !== undefined && {
            joiningDate: new Date(customerData.joiningDate),
          }),
        },
        include: {
          partner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
              contactInfo: true,
              email: true,
              address: true,
              status: true,
            },
          },
          history: {
            // take: 1,
            include: {
              product: {
                select: {
                  id: true,
                  productName: true,
                  productPrice: true,
                  status: true,
                },
              },
              renewals: {
                select: {
                  id: true,
                  purchaseDate: true,
                  renewalDate: true,
                  expiryDate: true,
                },
                orderBy: { purchaseDate: "desc" },
              },
            },
          },
        },
      });
      // if (updatedCustomer.count === 0) throw new Error("Not found or unauthorized");

      // 5) If any new products provided, append them to CustomerProductHistory
      let createdHistory: Array<any> = [];
      if (Array.isArray(product) && product.length > 0) {
        createdHistory = await Promise.all(
          product.map((p) => {
            const purchase = new Date(p.purchaseDate);
            let renewalDate: Date | undefined;
            let expiryDate: Date | undefined;
            const period = p.renewPeriod ?? "custom";

            switch (period) {
              case "monthly":
                renewalDate = addMonths(purchase, 1);
                break;
              case "quarterly":
                renewalDate = addMonths(purchase, 3);
                break;
              case "half_yearly":
                renewalDate = addMonths(purchase, 6);
                break;
              case "yearly":
                renewalDate = addYears(purchase, 1);
                break;
              default:
                renewalDate = p.renewalDate
                  ? new Date(p.renewalDate)
                  : undefined;
                expiryDate = p.expiryDate ? new Date(p.expiryDate) : undefined;
            }

            if (renewalDate && !expiryDate) {
              expiryDate = new Date(renewalDate);
              expiryDate.setDate(expiryDate.getDate() - 1);
            }

            return tx.customerProductHistory.create({
              data: {
                customerId,
                adminId,
                productId: p.productId,
                purchaseDate: purchase,
                status: true,
                renewPeriod: period,
                renewal: p.renewal ?? false,
                renewalDate,
                expiryDate,
              },
            });
          })
        );
      }

      // console.log("createdHistory----->", createdHistory)

      return { updatedCustomer, createdHistory };
    });

    const sanitized = {
      ...result.updatedCustomer,
      ...result.createdHistory,
    };

    // console.log("result.updatedCustomer----->", sanitized)

    // 6) Respond with both updated customer and any new history entries
    sendSuccessResponse(res, 200, "Customer updated", {
      customer: sanitized,
    });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") sendErrorResponse(res, 409, "Duplicate field");
      if (err.code === "P2016") sendErrorResponse(res, 404, "Record not found");
    }
    console.error(err);
    if (!res.headersSent) next(err);
    else sendErrorResponse(res, 500, "Server error");
  }
};

export const setCustomerStatus = async (
  req: Request<{ id: string }, {}, { status: boolean }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const customerId = req.params.id;
  const { status } = req.body;

  // 1. Auth check (only admin, super_admin, sub_admin, partner, team_member can toggle within their scope)
  const user = req.user;
  if (!user) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }

  // 2. Determine scoping filter
  const baseFilter: any = { id: customerId };
  switch (user.role) {
    case "admin":
    case "super_admin":
      baseFilter.adminId = user.id;
      break;
    case "partner":
      baseFilter.adminId = user.adminId!;
      baseFilter.partnerId = user.id;
      break;
    case "team_member":
    case "sub_admin":
      baseFilter.adminId = user.adminId!;
      break;
    default:
      sendErrorResponse(res, 403, "Forbidden");
      return;
  }

  try {
    // 3. Transaction: update customer.status and all its history.status
    const customer = await prisma.$transaction(async (tx) => {
      // 3a. Update the customer
      const updatedCustomer = await tx.customer.update({
        where: baseFilter,
        data: { status },
      });
      if (!updatedCustomer) {
        throw new Error("Customer not found or not in your scope");
      }

      // 3b. Update all related CustomerProductHistory rows
      const updatedHistory = await tx.customerProductHistory.updateMany({
        where: { customerId },
        data: { status },
      });

      return updatedCustomer;
    });

    // 4. Send back counts of what was updated
    sendSuccessResponse(res, 200, "Status updated", { customer });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        sendErrorResponse(res, 404, "Customer not found");
      if (err.code === "P2003")
        sendErrorResponse(res, 400, "Invalid scope or foreign key");
    }
    console.error("setCustomerStatus error:", err);
    if (!res.headersSent) next(err);
    else sendErrorResponse(res, 500, "Server error");
  }
};

export const deleteCustomer = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const customerId = req.params.id;
  const user = req.user;
  if (!user) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }

  // Build scope filter so users can only delete within their permissions
  const baseFilter: any = { id: customerId };
  switch (user.role) {
    case "admin":
    case "super_admin":
      baseFilter.adminId = user.id;
      break;
    case "partner":
      baseFilter.adminId = user.adminId!;
      baseFilter.partnerId = user.id;
      break;
    case "team_member":
    case "sub_admin":
      baseFilter.adminId = user.adminId!;
      break;
    default:
      sendErrorResponse(res, 403, "Forbidden");
      return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1) Find all history entries for this customer
      const histories = await tx.customerProductHistory.findMany({
        where: { customerId },
      });
      const historyIds = histories.map((h) => h.id);

      // 2) Delete all renewal records that reference those history entries
      const delRenewals = await tx.productRenewalHistory.deleteMany({
        where: { customerProductHistoryId: { in: historyIds } },
      });

      // 3) Delete the customerProductHistory entries
      const delHistory = await tx.customerProductHistory.deleteMany({
        where: { customerId },
      });

      // 4) Finally delete the customer itself
      const delCustomer = await tx.customer.deleteMany({
        where: baseFilter,
      });

      return {
        renewalRecordsDeleted: delRenewals.count,
        historyRecordsDeleted: delHistory.count,
        customersDeleted: delCustomer.count,
      };
    });

    if (result.customersDeleted === 0) {
      sendErrorResponse(res, 404, "Customer not found or not in your scope");
      return;
    }

    sendSuccessResponse(res, 200, "Customer deleted", {
      customer: {
        id: customerId,
        renewalRecordsDeleted: result.renewalRecordsDeleted,
        historyRecordsDeleted: result.historyRecordsDeleted,
        customersDeleted: result.customersDeleted,
      },
    });
  } catch (err) {
    console.error("deleteCustomer error:", err);
    sendErrorResponse(res, 500, "Server error");
  }
};

/**
 * PUT /customers/:customerId/products/:historyId
 */
export const editCustomerProduct = async (
  req: Request<{ customerId: string; ProductId: string }, {}>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { customerId, ProductId } = req.params;

  if (!customerId || !ProductId) {
    sendErrorResponse(res, 404, "Invalid input");
    return;
  }

  const {
    purchaseDate,
    renewPeriod,
    renewal,
    renewalDate,
    expiryDate,
    status,
  } = req.body;

  // console.log("BODY--->",req.body)

  const user = req.user as { id: string; role: string; adminId?: string };


  if (!user) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }
  // console.log("user--->",user)

  const baseFilter: any = {
    id: ProductId,
    customerId,
  };

  switch (user.role) {
    case "admin":
    case "super_admin":
      baseFilter.adminId = user.id;
      break;
    case "partner":
      baseFilter.adminId = user.adminId!;
      baseFilter.customer = { partnerId: user.id };
      break;
    case "team_member":
    case "sub_admin":
      baseFilter.adminId = user.adminId!;
      break;
    default:
      sendErrorResponse(res, 403, "Forbidden");
      return;
  }

  let updateData: any = {};

  try {
    let purchase: Date | undefined;
    let newRenewalDate: Date | undefined;
    let newExpiryDate: Date | undefined;

    if (purchaseDate) {
      purchase = parseISO(purchaseDate);
      if (isNaN(purchase.getTime())) {
        sendErrorResponse(res, 400, "Invalid purchaseDate format");
        return;
      }
      // if (purchase > new Date()) {
      //   sendErrorResponse(res, 400, "Purchase date cannot be in the future");
      //   return;
      // }
      updateData.purchaseDate = purchaseDate;
    }

    if (renewPeriod) {
      updateData.renewPeriod = renewPeriod;

      if (purchase) {
        switch (renewPeriod) {
          case "monthly":
            newRenewalDate = addMonths(purchase, 1);
            break;
          case "quarterly":
            newRenewalDate = addMonths(purchase, 3);
            break;
          case "half_yearly":
            newRenewalDate = addMonths(purchase, 6);
            break;
          case "yearly":
            newRenewalDate = addYears(purchase, 1);
            break;
          case "custom":
          default:
            break;
        }
      }
    }

    if (renewal !== undefined) updateData.renewal = renewal;

    if (renewPeriod === "custom") {
      if (renewalDate) updateData.renewalDate = new Date(renewalDate);
      if (expiryDate) updateData.expiryDate = new Date(expiryDate);
    } else {
      if (newRenewalDate) {
        updateData.renewalDate = newRenewalDate;
        updateData.expiryDate = new Date(newRenewalDate);
        updateData.expiryDate.setDate(updateData.expiryDate.getDate() - 1);
      }
    }

    if (status !== undefined) updateData.status = status;

    const updatedHistory = await prisma.$transaction(async (tx) => {
      const product = await tx.customerProductHistory.update({
        where: baseFilter,
        data: updateData,
      });

      const customer = await tx.customer.findMany({
        where: { id: customerId },
        include: {
          partner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
              contactInfo: true,
              email: true,
              address: true,
              status: true,
            },
          },
          history: {
            include: {
              product: {
                select: {
                  id: true,
                  productName: true,
                  productPrice: true,
                  status: true,
                },
              },
              renewals: {
                select: {
                  id: true,
                  purchaseDate: true,
                  renewalDate: true,
                  expiryDate: true,
                },
                orderBy: { purchaseDate: "desc" },
              },
            },
          },
        },
      });

      return { customer, product };
    });

    const sanitized = updatedHistory.customer.map((cust) => ({
      id: cust.id,
      companyName: cust.companyName,
      contactPerson: cust.contactPerson,
      mobileNumber: cust.mobileNumber,
      email: cust.email,
      serialNo: cust.serialNo,
      prime: cust.prime,
      blacklisted: cust.blacklisted,
      remark: cust.remark,
      address: cust.address,
      adminCustomFields: cust.adminCustomFields,
      joiningDate: cust.joiningDate,
      hasReference: cust.hasReference,
      status: cust.status,
      partner: cust.partner,
      createdAt: cust.createdAt,
      product: cust.history.map((h) => ({
        productDetails: h.product,
        id: h.id,
        renewPeriod: h.renewPeriod,
        purchaseDate: h.purchaseDate,
        expiryDate: h.expiryDate,
        renewalDate: h.renewalDate,
        renewal: h.renewal,
        status: h.status,
        history: h.renewals ?? null,
      })),
    }));

    sendSuccessResponse(res, 200, "Product updated", {
      customer: sanitized[0], // Assuming only one customer is returned
      // product: updatedHistory.product,
    });
  } catch (err: any) {
    console.log("\n\neditCustomerProduct error----->", err);
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      sendErrorResponse(res, 404, "Product history not found or out of scope");
      return;
    }
    console.error("editCustomerProduct error:", err);
    if (!res.headersSent) next(err);
    else sendErrorResponse(res, 500, "Server error");
  }
};

