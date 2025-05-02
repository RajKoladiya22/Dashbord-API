declare namespace Express {
    export interface Request {
      cookies: Record<string,string>;
      user?: {
        id: string;
        role: string;
        adminId: string;
      };
    }
  }