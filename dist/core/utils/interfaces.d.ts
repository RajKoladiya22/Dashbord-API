import { Request } from "express";
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
        adminId: string;
    };
}
export interface signInBody {
    identifier: string;
    email: string;
    password: string;
}
export interface signUpBody {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    contactNumber: string;
    companyName: string;
    address: string;
    planStatus: string;
}
export interface login_cred {
    email?: string;
    id?: string;
    role?: "admin" | "team_member" | "partner";
    passwordHash?: string;
    createdAt?: Date;
    updatedAt?: Date;
    adminId?: string | null;
    userProfileId?: string;
}
