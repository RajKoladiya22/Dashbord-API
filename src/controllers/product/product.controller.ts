// src/controllers/product.controller.ts

import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.config";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/responseHandler";
import { createProductSchema } from "../../core/utils/zod";
import { z } from "zod";

/**
 * GET /products
 * Query Params:
 *   - q?: string     // search term for productName (partial match)
 *   - page?: number  // pagination page (default 1)
 *   - perPage?: number // items per page (default 20)
 * curl -X GET "https://localhost:3000/v1/product?q=usb&page=2&perPage=10" \
 *   -H "Authorization: Bearer YOUR_JWT_TOKEN"
 */
export const listProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  if (!user) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }

  // Determine parent adminId
  const adminId = user.role === "admin" ? user.id : user.adminId;
  if (!adminId) {
    sendErrorResponse(res, 403, "Cannot determine admin context");
    return;
  }

  // Optional search & pagination
  const q = typeof req.query.q === "string" && req.query.q.trim();
  const page = Math.max(parseInt(`${req.query.page}`, 10) || 1, 1);
  const perPage = Math.min(
    Math.max(parseInt(`${req.query.perPage}`, 10) || 20, 1),
    100
  );
  const skip = (page - 1) * perPage;

  try {
    // Build filter
    const where: any = { adminId };
    if (q) {
      where.productName = { contains: q, mode: "insensitive" };
    }

    // Fetch total & items in parallel
    const [total, product] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
        select: {
          id: true,
          productName: true,
          productPrice: true,
          productCategory: true,
          description: true,
          productLink: true,
          tags: true,
          specifications: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    sendSuccessResponse(res, 200, "Products fetched", {
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
      product, // return the array
    });
  } catch (err) {
    console.error("listProducts error:", err);
    sendErrorResponse(res, 500, "Server error");
    next(err);
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // 2) Validate request body
  // const parsed = createProductSchema.safeParse(req.body);
  // console.log("Parsed--->", parsed);
  // console.log("req.body--->", req.body);

  // if (!parsed.success) {
  //   sendErrorResponse(res, 400, "Invalid input", {
  //     errors: parsed.error.errors,
  //   });
  //   return;
  // }
  const {
    product_name,
    product_category,
    product_price,
    description,
    product_link,
    tags,
    specifications,
  } = req.body;

  // 3) Determine adminId from authenticated user
  const user = req.user;
  if (!user) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }
  const adminId = user.role === "admin" ? user.id : user.adminId;
  if (!adminId) {
    sendErrorResponse(res, 403, "Cannot determine admin context");
    return;
  }

  try {
    // 4) Create product within a transaction
    const product = await prisma.$transaction(async (tx) => {
      return tx.product.create({
        data: {
          adminId,
          productName: product_name,
          productCategory: product_category,
          productPrice: product_price,
          description,
          productLink: product_link,
          tags,
          specifications,
        },
        select: {
          id: true,
          productName: true,
          productCategory: true,
          productPrice: true,
          description: true,
          productLink: true,
          tags: true,
          specifications: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    // 5) Return the newly created product
    sendSuccessResponse(res, 201, "Product created", { product });
  } catch (err) {
    console.error("createProduct error:", err);
    sendErrorResponse(res, 500, "Server error");
    return;
  }
};

/**
 * PUT /product/:id
 */
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // 1) Validate params & body
  const idSchema = z.object({ id: z.string().uuid() });
  const paramResult = idSchema.safeParse(req.params);
  if (!paramResult.success) {
    sendErrorResponse(res, 400, "Invalid product ID");
    return;
  }

  // const bodyResult = productSchema.partial().safeParse(req.body);
  // if (!bodyResult.success) {
  //   return sendErrorResponse(res, 400, "Invalid input", { errors: bodyResult.error.errors });
  // }
  const { id } = paramResult.data;
  const updates = req.body;
  // console.log("REQ.BODY--->", updates);
  

  // 2) Determine admin context
  const user = req.user;
  if (!user) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }

  const adminId = user.role === "admin" ? user.id : user.adminId;
  if (!adminId) {
    sendErrorResponse(res, 403, "Cannot determine admin context");
    return;
  }

  try {
    // 3) Transaction: ensure ownership and update
    const product = await prisma.$transaction(async (tx) => {
      // 3a) Confirm product belongs to this admin
      const existing = await tx.product.findUnique({
        where: { id },
        select: { adminId: true },
      });
      if (!existing || existing.adminId !== adminId) {
        throw new Error("Not found or unauthorized");
      }

      // 3b) Perform update
      return tx.product.update({
        where: { id },
        data: {
          productName: updates.productName,
          productCategory: updates.productCategory,
          productPrice: updates.productPrice,
          description: updates.description,
          productLink: updates.productLink,
          tags: updates.tags,
          specifications: updates.specifications,
        },
        select: {
          id: true,
          productName: true,
          productCategory: true,
          productPrice: true,
          description: true,
          productLink: true,
          tags: true,
          specifications: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    sendSuccessResponse(res, 200, "Product updated", { product });
    return;
  } catch (err: any) {
    console.error("updateProduct error:", err);
    if (err.message === "Not found or unauthorized") {
      sendErrorResponse(res, 404, err.message);
      return;
    } else {
      sendErrorResponse(res, 500, "Server error");
      return;
    }
    next(err);
  }
};

/**
 * DELETE /product/:id
 */
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // 1) Validate params
  const idSchema = z.object({ id: z.string().uuid() });
  const parse = idSchema.safeParse(req.params);
  if (!parse.success) {
    sendErrorResponse(res, 400, "Invalid product ID");
    return;
  }
  const { id } = parse.data;

  // 2) Determine admin context
  const user = req.user;
  if (!user) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }
  const adminId = user.role === "admin" ? user.id : user.adminId;
  if (!adminId) {
    sendErrorResponse(res, 403, "Cannot determine admin context");
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 3a) Confirm ownership
      const existing = await tx.product.findUnique({
        where: { id },
        select: { adminId: true },
      });
      if (!existing || existing.adminId !== adminId) {
        throw new Error("Not found or unauthorized");
      }
      // 3b) Delete
      await tx.product.delete({ where: { id } });
    });

    sendSuccessResponse(res, 200, "Product deleted");
  } catch (err: any) {
    console.error("deleteProduct error:", err);
    if (err.message === "Not found or unauthorized") {
      sendErrorResponse(res, 404, err.message);
      return;
    } else {
      sendErrorResponse(res, 500, "Server error");
      return;
    }
    next(err);
  }
};
