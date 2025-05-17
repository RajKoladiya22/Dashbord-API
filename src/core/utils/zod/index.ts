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
  firstName: z.string().min(1),
  companyName: z.string().min(1),
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
  role: z.enum(["team_member", "sub_admin"]),
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
export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;

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

export const signUpSuperAdminSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  contactNumber: z.string().optional(),
  address: z.record(z.any()).optional(),
});

export const createCustomerSchema = z.object({
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
export type CreateCustomerBody = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = z.object({
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  mobileNumber: z.string().optional(),
  email: z.string().email().optional(),
  serialNo: z.string().optional(),
  prime: z.boolean().optional(),
  blacklisted: z.boolean().optional(),
  remark: z.string().nullable(),
  hasReference: z.boolean().optional(),
  partnerId: z.string().uuid().nullable().optional(),
  adminCustomFields: z.record(z.any()).optional(),
  address: z.record(z.any()).optional(),
  joiningDate: z.string().optional(),
  // **New**: products to append to history
  product: z
  .array(
    z.object({
      productId: z.string().uuid(),
      purchaseDate: z.string(),
      renewal: z.boolean().optional(),
      expiryDate: z.string().optional(),
      renewalDate: z.string().optional(),
      details: z.string().optional(),
      renewPeriod: z.enum(["monthly", "quarterly", "half_yearly", "yearly", "custom"]).optional(),
    })
  )
  .optional(),
});
export type UpdateCustomerBody = z.infer<typeof updateCustomerSchema>;

export const updateHistorySchema = z.object({
  purchaseDate: z.string().optional(),
  renewal: z.boolean().optional(),
  expiryDate: z.string().optional(),
  renewalDate: z.string().optional(),
  status: z.boolean().optional(),
});
export type UpdateHistoryBody = z.infer<typeof updateHistorySchema>;

export const updateCustomFieldSchema = z.object({
  fieldName: z.string().min(1).optional(),
  fieldType: z.string().min(1).optional(),
  isRequired: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  isMultiSelect: z.boolean().optional(),
});

export const createCustomFieldSchema = z.object({
  fieldName: z.string().min(1),
  fieldType: z.string().min(1),
  isRequired: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  isMultiSelect: z.boolean().optional(),
});


export const listPlansQuery = z.object({
  status: z.string().optional().transform(s => s === "false" ? false : true),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
export type ListPlansQuery_ = z.infer<typeof listPlansQuery>;

export const statusSchema = z.object({ status: z.boolean() });
export type StatusBody = z.infer<typeof statusSchema>;


export const createPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  duration: z.string().min(1, "Duration is required"),
  price: z.number().nonnegative("Price must be ≥ 0"),
  offers: z
    .array(
      z.object({
        offerType: z.enum(["percentage", "fixed", "free_trial"]),
        value: z.number().optional(),
        startsAt: z.string().optional(),
        endsAt: z.string().optional(),
      })
    )
    .optional(),
  specs: z
    .array(
      z.object({
        specName: z.string().min(1),
        specValue: z.string().min(1),
      })
    )
    .optional(),
  descriptions: z
    .array(
      z.object({
        content: z.string().min(1),
      })
    )
    .optional(),
});
export type CreatePlanBody = z.infer<typeof createPlanSchema>;


