import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.config";
import bcrypt from "bcryptjs";
import { logger } from "@core/middleware/logs/logger";

export const createTeamMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { firstName, lastName, email, password, department, position } =
      req.body;
    console.log(req.body);
    const hash = await bcrypt.hash(password, 10);

    const tm = "Done"
    // const tm = await prisma.teamMember.create({
    //   data: {
    //     firstName,
    //     lastName,
    //     email,
    //     passwordHash: hash,
    //     adminId: "123",
    //   },
    // });

    console.log("tm--->", tm);
    // res.status(201).json(tm);
    res.json({
      message: "Done",
      data: tm,
    });
    return;
  } catch (err) {
    next(err);
  }
};
