import { z } from "zod";
export declare const signInSchema: z.ZodObject<{
    identifier: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    identifier: string;
    password: string;
}, {
    identifier: string;
    password: string;
}>;
export type SignInSchema = z.infer<typeof signInSchema>;
export declare const signUpSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    contactNumber: z.ZodOptional<z.ZodString>;
    companyName: z.ZodString;
    address: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    contactNumber?: string | undefined;
    address?: any;
}, {
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    contactNumber?: string | undefined;
    address?: any;
}>;
export type SignUpSchema = z.infer<typeof signUpSchema>;
export declare const createPartnerSchema: z.ZodObject<{
    firstName: z.ZodString;
    companyName: z.ZodString;
    contact_info: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    firstName: string;
    email: string;
    companyName: string;
    contact_info?: Record<string, any> | undefined;
}, {
    password: string;
    firstName: string;
    email: string;
    companyName: string;
    contact_info?: Record<string, any> | undefined;
}>;
export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;
export declare const createTeamMemberSchema: z.ZodObject<{
    adminId: z.ZodString;
    full_name: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    department: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodString>;
    role: z.ZodEnum<["team_member", "sub_admin"]>;
    status: z.ZodDefault<z.ZodString>;
    contactInfo: z.ZodOptional<z.ZodObject<{
        phone: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email?: string | undefined;
        phone?: string | undefined;
    }, {
        email?: string | undefined;
        phone?: string | undefined;
    }>>;
    address: z.ZodOptional<z.ZodObject<{
        street: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodString>;
        zip: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        street?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zip?: string | undefined;
    }, {
        street?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zip?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    password: string;
    status: string;
    firstName: string;
    lastName: string;
    email: string;
    adminId: string;
    full_name: string;
    role: "team_member" | "sub_admin";
    address?: {
        street?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zip?: string | undefined;
    } | undefined;
    department?: string | undefined;
    position?: string | undefined;
    contactInfo?: {
        email?: string | undefined;
        phone?: string | undefined;
    } | undefined;
}, {
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    adminId: string;
    full_name: string;
    role: "team_member" | "sub_admin";
    status?: string | undefined;
    address?: {
        street?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zip?: string | undefined;
    } | undefined;
    department?: string | undefined;
    position?: string | undefined;
    contactInfo?: {
        email?: string | undefined;
        phone?: string | undefined;
    } | undefined;
}>;
export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
export declare const createProductSchema: z.ZodObject<{
    product_name: z.ZodString;
    product_category: z.ZodRecord<z.ZodString, z.ZodAny>;
    product_price: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    product_link: z.ZodOptional<z.ZodString>;
    tags: z.ZodArray<z.ZodString, "many">;
    specifications: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    product_name: string;
    product_category: Record<string, any>;
    product_price: string;
    tags: string[];
    specifications: Record<string, any>;
    description?: string | undefined;
    product_link?: string | undefined;
}, {
    product_name: string;
    product_category: Record<string, any>;
    product_price: string;
    tags: string[];
    specifications: Record<string, any>;
    description?: string | undefined;
    product_link?: string | undefined;
}>;
export type CreateProductBody = z.infer<typeof createProductSchema>;
export declare const signUpSuperAdminSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    contactNumber: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    contactNumber?: string | undefined;
    address?: Record<string, any> | undefined;
}, {
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    contactNumber?: string | undefined;
    address?: Record<string, any> | undefined;
}>;
export declare const createCustomerSchema: z.ZodObject<{
    companyName: z.ZodString;
    contactPerson: z.ZodString;
    mobileNumber: z.ZodString;
    email: z.ZodString;
    serialNo: z.ZodOptional<z.ZodString>;
    prime: z.ZodOptional<z.ZodBoolean>;
    blacklisted: z.ZodOptional<z.ZodBoolean>;
    remark: z.ZodOptional<z.ZodString>;
    hasReference: z.ZodOptional<z.ZodBoolean>;
    partnerId: z.ZodOptional<z.ZodString>;
    adminCustomFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    address: z.ZodRecord<z.ZodString, z.ZodAny>;
    joiningDate: z.ZodString;
    products: z.ZodOptional<z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        expiryDate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        expiryDate?: string | undefined;
    }, {
        productId: string;
        expiryDate?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    email: string;
    companyName: string;
    address: Record<string, any>;
    contactPerson: string;
    mobileNumber: string;
    joiningDate: string;
    serialNo?: string | undefined;
    prime?: boolean | undefined;
    blacklisted?: boolean | undefined;
    remark?: string | undefined;
    hasReference?: boolean | undefined;
    partnerId?: string | undefined;
    adminCustomFields?: Record<string, any> | undefined;
    products?: {
        productId: string;
        expiryDate?: string | undefined;
    }[] | undefined;
}, {
    email: string;
    companyName: string;
    address: Record<string, any>;
    contactPerson: string;
    mobileNumber: string;
    joiningDate: string;
    serialNo?: string | undefined;
    prime?: boolean | undefined;
    blacklisted?: boolean | undefined;
    remark?: string | undefined;
    hasReference?: boolean | undefined;
    partnerId?: string | undefined;
    adminCustomFields?: Record<string, any> | undefined;
    products?: {
        productId: string;
        expiryDate?: string | undefined;
    }[] | undefined;
}>;
export type CreateCustomerBody = z.infer<typeof createCustomerSchema>;
export declare const updateCustomerSchema: z.ZodObject<{
    companyName: z.ZodOptional<z.ZodString>;
    contactPerson: z.ZodOptional<z.ZodString>;
    mobileNumber: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    serialNo: z.ZodOptional<z.ZodString>;
    prime: z.ZodOptional<z.ZodBoolean>;
    blacklisted: z.ZodOptional<z.ZodBoolean>;
    remark: z.ZodOptional<z.ZodString>;
    hasReference: z.ZodOptional<z.ZodBoolean>;
    partnerId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    adminCustomFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    joiningDate: z.ZodOptional<z.ZodString>;
    product: z.ZodOptional<z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        purchaseDate: z.ZodString;
        renewal: z.ZodOptional<z.ZodBoolean>;
        expiryDate: z.ZodOptional<z.ZodString>;
        renewalDate: z.ZodOptional<z.ZodString>;
        detail: z.ZodOptional<z.ZodString>;
        renewPeriod: z.ZodOptional<z.ZodEnum<["monthly", "quarterly", "half_yearly", "yearly", "custom"]>>;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        purchaseDate: string;
        expiryDate?: string | undefined;
        renewal?: boolean | undefined;
        renewalDate?: string | undefined;
        detail?: string | undefined;
        renewPeriod?: "custom" | "monthly" | "quarterly" | "half_yearly" | "yearly" | undefined;
    }, {
        productId: string;
        purchaseDate: string;
        expiryDate?: string | undefined;
        renewal?: boolean | undefined;
        renewalDate?: string | undefined;
        detail?: string | undefined;
        renewPeriod?: "custom" | "monthly" | "quarterly" | "half_yearly" | "yearly" | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    companyName?: string | undefined;
    address?: Record<string, any> | undefined;
    contactPerson?: string | undefined;
    mobileNumber?: string | undefined;
    serialNo?: string | undefined;
    prime?: boolean | undefined;
    blacklisted?: boolean | undefined;
    remark?: string | undefined;
    hasReference?: boolean | undefined;
    partnerId?: string | null | undefined;
    adminCustomFields?: Record<string, any> | undefined;
    joiningDate?: string | undefined;
    product?: {
        productId: string;
        purchaseDate: string;
        expiryDate?: string | undefined;
        renewal?: boolean | undefined;
        renewalDate?: string | undefined;
        detail?: string | undefined;
        renewPeriod?: "custom" | "monthly" | "quarterly" | "half_yearly" | "yearly" | undefined;
    }[] | undefined;
}, {
    email?: string | undefined;
    companyName?: string | undefined;
    address?: Record<string, any> | undefined;
    contactPerson?: string | undefined;
    mobileNumber?: string | undefined;
    serialNo?: string | undefined;
    prime?: boolean | undefined;
    blacklisted?: boolean | undefined;
    remark?: string | undefined;
    hasReference?: boolean | undefined;
    partnerId?: string | null | undefined;
    adminCustomFields?: Record<string, any> | undefined;
    joiningDate?: string | undefined;
    product?: {
        productId: string;
        purchaseDate: string;
        expiryDate?: string | undefined;
        renewal?: boolean | undefined;
        renewalDate?: string | undefined;
        detail?: string | undefined;
        renewPeriod?: "custom" | "monthly" | "quarterly" | "half_yearly" | "yearly" | undefined;
    }[] | undefined;
}>;
export type UpdateCustomerBody = z.infer<typeof updateCustomerSchema>;
export declare const updateHistorySchema: z.ZodObject<{
    purchaseDate: z.ZodOptional<z.ZodString>;
    renewal: z.ZodOptional<z.ZodBoolean>;
    expiryDate: z.ZodOptional<z.ZodString>;
    renewalDate: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodBoolean>;
    detail: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: boolean | undefined;
    expiryDate?: string | undefined;
    purchaseDate?: string | undefined;
    renewal?: boolean | undefined;
    renewalDate?: string | undefined;
    detail?: string | undefined;
}, {
    status?: boolean | undefined;
    expiryDate?: string | undefined;
    purchaseDate?: string | undefined;
    renewal?: boolean | undefined;
    renewalDate?: string | undefined;
    detail?: string | undefined;
}>;
export type UpdateHistoryBody = z.infer<typeof updateHistorySchema>;
export declare const updateCustomFieldSchema: z.ZodObject<{
    fieldName: z.ZodOptional<z.ZodString>;
    fieldType: z.ZodOptional<z.ZodString>;
    isRequired: z.ZodOptional<z.ZodBoolean>;
    options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isMultiSelect: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    options?: string[] | undefined;
    fieldName?: string | undefined;
    fieldType?: string | undefined;
    isRequired?: boolean | undefined;
    isMultiSelect?: boolean | undefined;
}, {
    options?: string[] | undefined;
    fieldName?: string | undefined;
    fieldType?: string | undefined;
    isRequired?: boolean | undefined;
    isMultiSelect?: boolean | undefined;
}>;
export declare const createCustomFieldSchema: z.ZodObject<{
    fieldName: z.ZodString;
    fieldType: z.ZodString;
    isRequired: z.ZodOptional<z.ZodBoolean>;
    options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isMultiSelect: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    fieldName: string;
    fieldType: string;
    options?: string[] | undefined;
    isRequired?: boolean | undefined;
    isMultiSelect?: boolean | undefined;
}, {
    fieldName: string;
    fieldType: string;
    options?: string[] | undefined;
    isRequired?: boolean | undefined;
    isMultiSelect?: boolean | undefined;
}>;
export declare const listPlansQuery: z.ZodObject<{
    status: z.ZodEffects<z.ZodOptional<z.ZodString>, boolean, string | undefined>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: boolean;
    page: number;
    limit: number;
}, {
    status?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type ListPlansQuery_ = z.infer<typeof listPlansQuery>;
export declare const statusSchema: z.ZodObject<{
    status: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    status: boolean;
}, {
    status: boolean;
}>;
export type StatusBody = z.infer<typeof statusSchema>;
export declare const createPlanSchema: z.ZodObject<{
    name: z.ZodString;
    duration: z.ZodString;
    price: z.ZodNumber;
    offers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        offerType: z.ZodEnum<["percentage", "fixed", "free_trial"]>;
        value: z.ZodOptional<z.ZodNumber>;
        startsAt: z.ZodOptional<z.ZodString>;
        endsAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        offerType: "percentage" | "fixed" | "free_trial";
        value?: number | undefined;
        startsAt?: string | undefined;
        endsAt?: string | undefined;
    }, {
        offerType: "percentage" | "fixed" | "free_trial";
        value?: number | undefined;
        startsAt?: string | undefined;
        endsAt?: string | undefined;
    }>, "many">>;
    specs: z.ZodOptional<z.ZodArray<z.ZodObject<{
        specName: z.ZodString;
        specValue: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        specName: string;
        specValue: string;
    }, {
        specName: string;
        specValue: string;
    }>, "many">>;
    descriptions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        content: string;
    }, {
        content: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    duration: string;
    price: number;
    offers?: {
        offerType: "percentage" | "fixed" | "free_trial";
        value?: number | undefined;
        startsAt?: string | undefined;
        endsAt?: string | undefined;
    }[] | undefined;
    specs?: {
        specName: string;
        specValue: string;
    }[] | undefined;
    descriptions?: {
        content: string;
    }[] | undefined;
}, {
    name: string;
    duration: string;
    price: number;
    offers?: {
        offerType: "percentage" | "fixed" | "free_trial";
        value?: number | undefined;
        startsAt?: string | undefined;
        endsAt?: string | undefined;
    }[] | undefined;
    specs?: {
        specName: string;
        specValue: string;
    }[] | undefined;
    descriptions?: {
        content: string;
    }[] | undefined;
}>;
export type CreatePlanBody = z.infer<typeof createPlanSchema>;
