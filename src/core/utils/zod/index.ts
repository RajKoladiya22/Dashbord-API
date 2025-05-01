import { z } from "zod";

export const signInSchema = z.object({
  identifier: z.string().email(),
  password: z.string().min(8),
});
export type SignInSchema = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  contactNumber: z.string().optional(),
  companyName: z.string().min(1),
  address: z.any().optional(),
});
export type SignUpSchema = z.infer<typeof signUpSchema>;

export const createPartnerSchema = z.object({
  partner_name: z.string().min(1),
  company_name: z.string().min(1),
  contact_info: z.record(z.any()).optional(),
  email: z.string().email(),
  password: z.string().min(8),
});
export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;