import { Request, Response, NextFunction } from "express";
import { prisma, env } from "../../config/database.config";
import { log } from "winston";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/responseHandler";
import { boolean, promise } from "zod";
import { send } from "node:process";
interface AdminLink {
  label: string;
  url: string;
}

interface AdminWithLinks {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: boolean;
  companyName: string;
  links: AdminLink[];
}


export const listAllAdmins = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;

  if (!user || user.role !== "super_admin") {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }

  // Pagination
  const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  // Search
  const q = (req.query.q as string)?.trim();
  const searchFilter = q
    ? {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { companyName: { contains: q, mode: "insensitive" } },
          // { mobileNumber: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  // Sorting
  const allowedSortFields = ["firstName", "lastName", "email", "companyName"];
  const sortBy = (req.query.sortBy as string) || "companyName";
  const sortOrder: "asc" | "desc" =
    (req.query.sortOrder as string)?.toLowerCase() === "asc" ? "asc" : "desc";

  if (!allowedSortFields.includes(sortBy)) {
    sendErrorResponse(
      res,
      400,
      `Invalid sortBy. Must be one of: ${allowedSortFields.join(", ")}`
    );
    return;
  }

  // Status filter
  let statusFilter = { status: true };
  if (req.query.status === "false") {
    statusFilter.status = false;
  }

  // Final filter
  const baseFilter: any = {
    ...searchFilter,
    ...statusFilter,
  };

  try {
    const [total, admins] = await Promise.all([
      prisma.admin.count({ where: baseFilter }),
      prisma.admin.findMany({
        where: baseFilter,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          companyName: true,
          contactInfo: true,
          status: true,
        },
      }),
    ]);

    sendSuccessResponse(res, 200, "Admins fetched", {
      admins,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("listAllAdmins error:", err);
    sendErrorResponse(res, 500, "Server error");
  }
};






export const subAdminDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;
  const id: string = req.params.id;
  const query: string = req.params.query;

  if (!user || user.role !== "super_admin") {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  // if(id){
  //   res.status(400).json({ message: " id",id });
  // }

  // const page = Math.max(req.query.page as string, 10 );

  try {

    if (query === "teammembers") {
      const teammembers = await prisma.teamMember.findMany({
        where: { adminId: id },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          status: true,
          role: true,
          department: true,
          position: true,
          contactInfo: true,
          address: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (!teammembers || teammembers.length === 0) {
        res.status(404).json({ message: "No team members found" });
        return;
      }
      const adminDetailsWithBackLink = teammembers.map((team) => ({
        ...team,
        backLink: "/api/v1/auth/details",
      }));
      res.status(200).json(adminDetailsWithBackLink);
      return;
    }
    else if (query === "patners") {
      const patners = await prisma.partner.findMany({
        where: {
          adminId: id
        },
        select: {
          // id: true,
          firstName: true,
          lastName: true,
          email: true,
          status: true,
          role: true,
          // department: true,
          // position: true,
          customers: true,
          contactInfo: true,
          address: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (!patners || patners.length === 0) {
        res.status(404).json({ message: "No patners are found" });
      }
      else {
        const adminDetailsWithBackLink = patners.map((team) => {
          return {
            ...team,
            backLink: '/api/v1/auth/details',
          };
        });
        res.status(200).json({ data: adminDetailsWithBackLink });

      }
    }
    else if (query === "subscription") {
      const subscription = await prisma.subscription.findMany({
        where: {
          adminId: id,
        },
        select: {
          plan: true,
          planId: true,
          status: true,
          startsAt: true,
          endsAt: true,
          renewedAt: true,
          cancelledAt: true,
          payments: true,
          events: true,
        },
      });
      if (!subscription || subscription.length === 0) {
        res.status(404).json({ message: "No subscription are found" });
      }
      else {
        const adminDetailsWithBackLink = subscription.map((team) => {
          return {
            ...team,
            backLink: '/api/v1/auth/details',
          };

        });
        res.status(200).json({ data: adminDetailsWithBackLink });

      }
    }
    else if (query === "products") {
      const products = await prisma.product.findMany({
        where: {
          adminId: id,
        },
        select: {
          // id: true,
          productName: true,
          productCategory: true,
          productPrice: true,
          description: true,
          productLink: true,
          specifications: true,
          tags: true,
          status: true,
          createdAt: true,
          customerProductHistory: true,
          renewalHistory: true,
          // updatedAt: true,
        },
      });
      if (!products || products.length === 0) {
        res.status(404).json({ message: "No products are found" });
      }
      else {
        const adminDetailsWithBackLink = products.map((team) => {
          return {
            ...team,
            backLink: '/api/v1/auth/details',
          };

        });
        res.status(200).json({ data: adminDetailsWithBackLink });
      }
    }
    else if (query === "customers") {
      console.log("->>>>>>>>..cal query");

      const customer = await prisma.customer.findMany({
        where: {
          adminId: id,
        },
        select: {
          // id: true,
          companyName: true,
          contactPerson: true,
          mobileNumber: true,
          email: true,
          serialNo: true,
          prime: true,
          blacklisted: true,
          adminCustomFields: true,
          createdAt: true,
          joiningDate: true,
          // renewalHistory: true,
          // updatedAt: true,
        },
      });
      console.log("-------> cusorm", id, customer);

      if (!customer || customer.length === 0) {
        res.status(404).json({ message: "No customers are found" });
      } else {
        const adminDetailsWithBackLink = customer.map((team) => {
          return {
            ...team,
            backLink: '/api/v1/auth/details',
          };
        });
        res.status(200).json({ data: adminDetailsWithBackLink });
      }

    }
    else if (query === "customerproducthistory") {
      const customerproducthistory = await prisma.customerProductHistory.findMany({
        where: {
          adminId: id,
        },
        select: {
          // id: true,
          customerId: true,
          adminId: true,
          productId: true,
          purchaseDate: true,
          renewPeriod: true,
          expiryDate: true,
          renewalDate: true,
          customer: true,
          product: true,
          // joiningDate: true,

        },
      });
      if (!customerproducthistory || customerproducthistory.length === 0) {
        res.status(404).json({ message: "No customerproducthistory are found" });
      }
      else {
        const adminDetailsWithBackLink = customerproducthistory.map((team) => {
          return {
            ...team,
            backLink: '/api/v1/auth/details',
          };

        });
        res.status(200).json({ data: adminDetailsWithBackLink });

      }
    }
    else if (query === "admincustomfield") {
      const admincustomfield = await prisma.adminCustomField.findMany({
        where: {
          adminId: id,
        },
        select: {
          // id: true,
          fieldName: true,
          fieldType: true,
          // productId: true,
          isRequired: true,
          options: true,
          isMultiSelect: true,
          status: true,
          createdAt: true,
          // product: true,
          // joiningDate: true,

        },
      });
      if (!admincustomfield || admincustomfield.length === 0) {
        res.status(404).json({ message: "No admincustomfield are found" });
      }
      else {
        const adminDetailsWithBackLink = admincustomfield.map((team) => {
          return {
            ...team,
            backLink: '/api/v1/auth/details',
          };
          res.status(200).json({ data: adminDetailsWithBackLink });
        });
      }
    }
    else {
      res.status(404).json({ message: "No Details found" });
    }

  }
  catch (err: any) {
    console.error("Error listing admin details:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const approveAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;

  if (!user || user.role !== "super_admin") {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }

  const adminId = req.params.id;
  const statusRaw = req.body.status;

  let adminStatus: boolean | null = null;

  if (typeof statusRaw === "boolean") {
    adminStatus = statusRaw;
  } else if (typeof statusRaw === "string") {
    if (statusRaw.toLowerCase() === "true") adminStatus = true;
    else if (statusRaw.toLowerCase() === "false") adminStatus = false;
  }

  if (adminStatus === null) {
    sendErrorResponse(res, 400, "Invalid status");
    return;
  }

  try {
    const adminDetails = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!adminDetails) {
      sendErrorResponse(res, 404, "Admin not found");
      return;
    }
    await prisma.loginCredential.updateMany({
      where: { userProfileId: adminDetails.id },
      data: {
        status: adminStatus,
      },
    })
    const approvedAdmin = await prisma.admin.update({
      where: { id: adminId },
      data: {
        status: adminStatus,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
      },
    });


    sendSuccessResponse(res, 200, "Admin Status Updated", approvedAdmin);
  } catch (err: any) {
    console.error("Error updating admin status:", err);
    sendErrorResponse(res, 500, "Server error");
  }
};

