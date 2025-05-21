import { Request, Response, NextFunction } from "express";

export const JustCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.json({
      OK: "DONE",
    });
  } catch (error) {
    console.log(error);
  }
};
