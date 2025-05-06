import { z } from "zod";

export const signInSchema = z.object({
  identifier: z.string().email(),
  password: z.string(),
  // password: z.string().min(8),
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

export const createTeamMemberSchema = z.object({
  adminId: z.string().uuid(),
  full_name: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  department: z.string().optional(),
  position: z.string().optional(),
  status: z.string().default("active"),
  contactInfo: z
    .object({ phone: z.string().optional(), email: z.string().optional() })
    .optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
    })
    .optional(),
});
export type CreateTeamMemberBody = z.infer<typeof createTeamMemberSchema>;

export const createProductSchema = z.object({
  product_name: z.string().min(1),
  product_category: z.record(z.any()), // JSON object
  product_price: z.string().min(1), // or z.number() if you convert client-side
  description: z.string().optional(),
  product_link: z.string().url().optional(),
  tags: z.array(z.string()),
  specifications: z.record(z.any()),
});
export type CreateProductBody = z.infer<typeof createProductSchema>;
