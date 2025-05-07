// src/controllers/customer/customer.controller.ts

import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.config";
import { z } from "zod";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/responseHandler";

// 1) Zod schema for input validation
const createCustomerSchema = z.object({
  companyName: z.string().min(1),
  contactPerson: z.string().min(1),
  mobileNumber: z.string().min(1),
  email: z.string().email(),
  serialNo: z.string().optional(),
  prime: z.boolean().optional(),
  blacklisted: z.boolean().optional(),
  remark: z.string().optional(),
  hasReference: z.boolean().optional(),
  partnerId: z.string().uuid().optional(),
  adminCustomFields: z.record(z.any()).optional(),
  address: z.record(z.any()),
  joiningDate: z.string(),
  // refine((s) => !isNaN(Date.parse(s)), {
  //   message: "Must be a valid ISO date string",
  // }),
  products: z
    .array(
      z.object({
        productId: z.string().uuid(),
        expiryDate: z.string().optional(),
        // .refine((s) => !s || !isNaN(Date.parse(s)), {
        //   message: "Must be a valid ISO date string or omitted",
        // }),
        // you can add more fields here if needed
      })
    )
    .optional(),
});
type CreateCustomerBody = z.infer<typeof createCustomerSchema>;

const updateCustomerSchema = z.object({
  companyName: z.string().min(1).optional(),
  contactPerson: z.string().min(1).optional(),
  mobileNumber: z.string().min(1).optional(),
  email: z.string().email().optional(),
  serialNo: z.string().optional(),
  prime: z.boolean().optional(),
  blacklisted: z.boolean().optional(),
  remark: z.string().optional(),
  hasReference: z.boolean().optional(),
  partnerId: z.string().uuid().optional(),
  adminCustomFields: z.record(z.any()).optional(),
  address: z.record(z.any()).optional(),
  joiningDate: z.string().optional(),
});
type UpdateCustomerBody = z.infer<typeof updateCustomerSchema>;

export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Validate request body
  // const parse = createCustomerSchema.safeParse(req.body);
  console.log("req.body----->\n", req.body);
  // console.log("parse----->\n", parse);

  // if (!parse.success) {
  //   sendErrorResponse(res, 400, "Invalid input", {
  //     errors: parse.error.errors,
  //   });
  //   return;
  // }
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
  const rawCustomFields = adminCustomFields;
  // const stringified = rawCustomFields.map((obj) => JSON.stringify(obj));
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
          joiningDate: new Date(joiningDate),
        },
      });
      console.log("customer----->\n", customer);

      // 2) Create history entries for each product
      const now = new Date();
      const historyCreates = products.map((p) =>
        tx.customerProductHistory.create({
          data: {
            customerId: customer.id,
            adminId,
            productId: p.productDetailId,
            purchaseDate: p.purchaseDate,
            status: true,
            renewal: p.renewal ? p.renewal : false,
            expiryDate: p.expiryDate ? new Date(p.expiryDate) : undefined,
            renewalDate: p.renewalDate ? new Date(p.renewalDate) : undefined,
          },
        })
      );
      const history = await Promise.all(historyCreates);

      return { customer, history };
    });

    // Return the created customer and its history
    sendSuccessResponse(res, 201, "Customer created", {
      customers: result.customer,
      history: result.history,
    });
    return;
  } catch (err) {
    console.error("createCustomer error:", err);
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

  // Build base filter
  const baseFilter: any = {};

  switch (user.role) {
    case "admin":
    case "super_admin":
      // Admins see their own customers
      baseFilter.adminId = user.id;
      break;

    case "partner":
      // Partners only see customers they own
      baseFilter.adminId = user.adminId!;
      baseFilter.partnerId = user.id;
      break;

    case "team_member":
      // Team members see all customers under their admin
      baseFilter.adminId = user.adminId!;
      break;

    default:
      sendErrorResponse(res, 403, "Forbidden");
      return;
  }

  try {
    const customers = await prisma.customer.findMany({
      where: baseFilter,
      orderBy: { createdAt: "desc" },
      include: {
        partner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
        history: {
          include: { product: true },
        },
      },
    });

    sendSuccessResponse(res, 200, "Customers fetched", { customers });
    return;
  } catch (err) {
    console.error("listCustomers error:", err);
    sendErrorResponse(res, 500, "Server error");
    return;
  }
};

export const updateCustomer = async (
  req: Request<{ id: string }, {}, unknown>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const customerId = req.params.id;
  // 1) Validate body
  const parsed = updateCustomerSchema.safeParse(req.body);
  if (!parsed.success) {
    sendErrorResponse(res, 400, "Invalid input", {
      errors: parsed.error.errors,
    });
    return;
  }
  const {
    companyName,
    contactPerson,
    mobileNumber,
    email,
    serialNo,
    prime,
    blacklisted,
    remark,
    hasReference,
    partnerId: incomingPartnerId,
    adminCustomFields,
    address,
    joiningDate,
  } = parsed.data as UpdateCustomerBody;

  // 2) Determine adminId & partnerId from logged‑in user
  const user = req.user as { id: string; role: string; adminId?: string };
  if (!user) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }
  const adminId = user.role === "admin" ? user.id : user.adminId!;
  const partnerId = user.role === "partner" ? user.id : incomingPartnerId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 3) Update the customer
      const customer = await tx.customer.update({
        where: { id: customerId, adminId: adminId },
        data: {
          // only include provided fields
          ...(companyName !== undefined && { companyName }),
          ...(contactPerson !== undefined && { contactPerson }),
          ...(mobileNumber !== undefined && { mobileNumber }),
          ...(email !== undefined && { email }),
          ...(serialNo !== undefined && { serialNo }),
          ...(prime !== undefined && { prime }),
          ...(blacklisted !== undefined && { blacklisted }),
          ...(remark !== undefined && { remark }),
          ...(hasReference !== undefined && { hasReference }),
          ...(partnerId !== undefined && { partnerId }),
          ...(adminCustomFields !== undefined && { adminCustomFields }),
          ...(address !== undefined && { address }),
          ...(joiningDate !== undefined && {
            joiningDate: new Date(joiningDate),
          }),
        },
      });

      return customer;
    });

    // 6) Return success
    sendSuccessResponse(res, 200, "Customer updated", {
      customer: result,
    });
  } catch (err) {
    console.error("updateCustomer error:", err);
    sendErrorResponse(res, 500, "Server error");
  }
};

//

// const updateCustomerSchema = createCustomerSchema.partial();

// const idParamSchema = z.object({ id: z.string().uuid() });

/**
 * POST /customers
 */
// export const createCustomerr = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   // 1) Validate body
//   const body = createCustomerSchema.safeParse(req.body);
//   if (!body.success) {
//     return sendErrorResponse(res, 400, "Invalid input", {
//       errors: body.error.errors,
//     });
//   }

//   // 2) Determine adminId & partnerId
//   const user = req.user;
//   if (!user) return sendErrorResponse(res, 401, "Unauthorized");
//   const adminId = user.role === "admin" ? user.id : user.adminId!;
//   const partnerId = user.role === "partner" ? user.id : undefined;

//   try {
//     // 3) Transaction to create customer
//     const customer = await prisma.$transaction(async (tx) => {
//       return tx.customer.create({
//         data: {
//           adminId,
//           partnerId,
//           companyName: body.data.companyName,
//           contactPerson: body.data.contactPerson,
//           mobileNumber: body.data.mobileNumber,
//           email: body.data.email,
//           serialNo: body.data.serialNo,
//           prime: body.data.prime ?? false,
//           blacklisted: body.data.blacklisted ?? false,
//           remark: body.data.remark,
//           adminCustomFields: body.data.adminCustomFields ?? {},
//           hasReference: body.data.hasReference ?? false,
//         },
//         select: {
//           id: true,
//           companyName: true,
//           contactPerson: true,
//           mobileNumber: true,
//           email: true,
//           serialNo: true,
//           prime: true,
//           blacklisted: true,
//           remark: true,
//           adminCustomFields: true,
//           hasReference: true,
//           partnerId: true,
//           createdAt: true,
//         },
//       });
//     });

//     return sendSuccessResponse(res, 201, "Customer created", { customer });
//   } catch (err) {
//     console.error("createCustomer error:", err);
//     return sendErrorResponse(res, 500, "Server error");
//   }
// };

/**
 * GET /customers
 */
// export const listCustomers = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   const user = req.user;
//   if (!user) {
//     sendErrorResponse(res, 401, "Unauthorized");
//     return;
//   }
//   const adminId = user.role === "admin" ? user.id : user.adminId!;
//   const partnerFilter = user.role === "partner" ? { partnerId: user.id } : {};

//   // search & paging
//   const q = typeof req.query.q === "string" && req.query.q.trim();
//   const page = Math.max(parseInt(`${req.query.page}`, 10) || 1, 1);
//   const perPage = Math.min(
//     Math.max(parseInt(`${req.query.perPage}`, 10) || 20, 1),
//     100
//   );
//   const skip = (page - 1) * perPage;

//   try {
//     // count + fetch
//     const [total, customers] = await prisma.$transaction([
//       prisma.customer.count({
//         where: {
//           adminId,
//           ...partnerFilter,
//           OR: q
//             ? [
//                 { companyName: { contains: q, mode: "insensitive" } },
//                 { contactPerson: { contains: q, mode: "insensitive" } },
//               ]
//             : undefined,
//         },
//       }),
//       prisma.customer.findMany({
//         where: {
//           adminId,
//           ...partnerFilter,
//           OR: q
//             ? [
//                 { companyName: { contains: q, mode: "insensitive" } },
//                 { contactPerson: { contains: q, mode: "insensitive" } },
//               ]
//             : undefined,
//         },
//         orderBy: { createdAt: "desc" },
//         skip,
//         take: perPage,
//         include: {
//           partner: {
//             select: {
//               id: true,
//               firstName: true,
//               lastName: true,
//               companyName: true,
//             },
//           },
//           history: { include: { product: true } },
//         },
//       }),
//     ]);

//     sendSuccessResponse(res, 200, "Customers fetched", {
//       meta: {
//         total,
//         page,
//         perPage,
//         totalPages: Math.ceil(total / perPage),
//       },
//       customers,
//     });
//     return;
//   } catch (err) {
//     console.error("listCustomers error:", err);
//     sendErrorResponse(res, 500, "Server error");
//     return;
//   }
// };

/**
 * PUT /customers/:id
 */
// export const updateCustomer = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   // validate params & body
//   const params = idParamSchema.safeParse(req.params);
//   if (!params.success) return sendErrorResponse(res, 400, "Invalid ID");
//   const body = updateCustomerSchema.safeParse(req.body);
//   if (!body.success) {
//     return sendErrorResponse(res, 400, "Invalid input", {
//       errors: body.error.errors,
//     });
//   }

//   const user = req.user!;
//   const adminId = user.role === "admin" ? user.id : user.adminId!;
//   const partnerId = user.role === "partner" ? user.id : undefined;

//   try {
//     const customer = await prisma.$transaction(async (tx) => {
//       // verify ownership
//       const existing = await tx.customer.findUnique({
//         where: { id: params.data.id },
//         select: { adminId: true, partnerId: true },
//       });
//       if (
//         !existing ||
//         existing.adminId !== adminId ||
//         (user.role === "partner" && existing.partnerId !== partnerId)
//       ) {
//         throw new Error("Not found or unauthorized");
//       }

//       return tx.customer.update({
//         where: { id: params.data.id },
//         data: { ...body.data },
//         include: {
//           partner: {
//             select: {
//               id: true,
//               firstName: true,
//               lastName: true,
//               companyName: true,
//             },
//           },
//           history: { include: { product: true } },
//         },
//       });
//     });

//     return sendSuccessResponse(res, 200, "Customer updated", { customer });
//   } catch (err: any) {
//     console.error("updateCustomer error:", err);
//     if (err.message === "Not found or unauthorized") {
//       return sendErrorResponse(res, 404, err.message);
//     }
//     return sendErrorResponse(res, 500, "Server error");
//   }
// };

/**
 * DELETE /customers/:id
 */
// export const deleteCustomer = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const params = idParamSchema.safeParse(req.params);
//   if (!params.success) return sendErrorResponse(res, 400, "Invalid ID");

//   const user = req.user!;
//   const adminId = user.role === "admin" ? user.id : user.adminId!;
//   const partnerId = user.role === "partner" ? user.id : undefined;

//   try {
//     await prisma.$transaction(async (tx) => {
//       const existing = await tx.customer.findUnique({
//         where: { id: params.data.id },
//         select: { adminId: true, partnerId: true },
//       });
//       if (
//         !existing ||
//         existing.adminId !== adminId ||
//         (user.role === "partner" && existing.partnerId !== partnerId)
//       ) {
//         throw new Error("Not found or unauthorized");
//       }
//       await tx.customer.delete({ where: { id: params.data.id } });
//     });

//     return sendSuccessResponse(res, 200, "Customer deleted");
//   } catch (err: any) {
//     console.error("deleteCustomer error:", err);
//     if (err.message === "Not found or unauthorized") {
//       return sendErrorResponse(res, 404, err.message);
//     }
//     return sendErrorResponse(res, 500, "Server error");
//   }
// };
