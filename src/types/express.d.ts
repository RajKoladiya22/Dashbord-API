declare namespace Express {
    export interface Request {
      cookies: Record<string,string>;
      user?: {
        id: string;
        role: string;
        // role: "admin" | "partner" | "team_member" | "super_admin";
        adminId: string;
      };
    }
  }