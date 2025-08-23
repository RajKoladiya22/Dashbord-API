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
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    password: string;
    address?: any;
    contactNumber?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    password: string;
    address?: any;
    contactNumber?: string | undefined;
}>;
export type SignUpSchema = z.infer<typeof signUpSchema>;
export declare const createPartnerSchema: z.ZodObject<{
    firstName: z.ZodString;
    companyName: z.ZodString;
    contact_info: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    email: string;
    companyName: string;
    password: string;
    contact_info?: Record<string, any> | undefined;
}, {
    firstName: string;
    email: string;
    companyName: string;
    password: string;
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
    status: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "team_member" | "sub_admin";
    adminId: string;
    password: string;
    full_name: string;
    contactInfo?: {
        email?: string | undefined;
        phone?: string | undefined;
    } | undefined;
    address?: {
        street?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zip?: string | undefined;
    } | undefined;
    department?: string | undefined;
    position?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    email: string;
    role: "team_member" | "sub_admin";
    adminId: string;
    password: string;
    full_name: string;
    status?: string | undefined;
    contactInfo?: {
        email?: string | undefined;
        phone?: string | undefined;
    } | undefined;
    address?: {
        street?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zip?: string | undefined;
    } | undefined;
    department?: string | undefined;
    position?: string | undefined;
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
    tags: string[];
    specifications: Record<string, any>;
    product_name: string;
    product_category: Record<string, any>;
    product_price: string;
    description?: string | undefined;
    product_link?: string | undefined;
}, {
    tags: string[];
    specifications: Record<string, any>;
    product_name: string;
    product_category: Record<string, any>;
    product_price: string;
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
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    address?: Record<string, any> | undefined;
    contactNumber?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    address?: Record<string, any> | undefined;
    contactNumber?: string | undefined;
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
    address: Record<string, any>;
    companyName: string;
    contactPerson: string;
    mobileNumber: string;
    joiningDate: string;
    serialNo?: string | undefined;
    prime?: boolean | undefined;
    blacklisted?: boolean | undefined;
    remark?: string | undefined;
    adminCustomFields?: Record<string, any> | undefined;
    hasReference?: boolean | undefined;
    partnerId?: string | undefined;
    products?: {
        productId: string;
        expiryDate?: string | undefined;
    }[] | undefined;
}, {
    email: string;
    address: Record<string, any>;
    companyName: string;
    contactPerson: string;
    mobileNumber: string;
    joiningDate: string;
    serialNo?: string | undefined;
    prime?: boolean | undefined;
    blacklisted?: boolean | undefined;
    remark?: string | undefined;
    adminCustomFields?: Record<string, any> | undefined;
    hasReference?: boolean | undefined;
    partnerId?: string | undefined;
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
    email: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">, z.ZodNull]>>;
    serialNo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    prime: z.ZodOptional<z.ZodBoolean>;
    blacklisted: z.ZodOptional<z.ZodBoolean>;
    connector: z.ZodOptional<z.ZodBoolean>;
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
        renewal?: boolean | undefined;
        renewPeriod?: "custom" | "monthly" | "quarterly" | "yearly" | "half_yearly" | undefined;
        expiryDate?: string | undefined;
        renewalDate?: string | undefined;
        detail?: string | undefined;
    }, {
        productId: string;
        purchaseDate: string;
        renewal?: boolean | undefined;
        renewPeriod?: "custom" | "monthly" | "quarterly" | "yearly" | "half_yearly" | undefined;
        expiryDate?: string | undefined;
        renewalDate?: string | undefined;
        detail?: string | undefined;
    }>, "many">>;
    motherCompanyId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email?: string | null | undefined;
    address?: Record<string, any> | undefined;
    product?: {
        productId: string;
        purchaseDate: string;
        renewal?: boolean | undefined;
        renewPeriod?: "custom" | "monthly" | "quarterly" | "yearly" | "half_yearly" | undefined;
        expiryDate?: string | undefined;
        renewalDate?: string | undefined;
        detail?: string | undefined;
    }[] | undefined;
    companyName?: string | undefined;
    contactPerson?: string | undefined;
    mobileNumber?: string | undefined;
    serialNo?: string | null | undefined;
    prime?: boolean | undefined;
    blacklisted?: boolean | undefined;
    connector?: boolean | undefined;
    remark?: string | undefined;
    adminCustomFields?: Record<string, any> | undefined;
    joiningDate?: string | undefined;
    hasReference?: boolean | undefined;
    partnerId?: string | null | undefined;
    motherCompanyId?: string | null | undefined;
}, {
    email?: string | null | undefined;
    address?: Record<string, any> | undefined;
    product?: {
        productId: string;
        purchaseDate: string;
        renewal?: boolean | undefined;
        renewPeriod?: "custom" | "monthly" | "quarterly" | "yearly" | "half_yearly" | undefined;
        expiryDate?: string | undefined;
        renewalDate?: string | undefined;
        detail?: string | undefined;
    }[] | undefined;
    companyName?: string | undefined;
    contactPerson?: string | undefined;
    mobileNumber?: string | undefined;
    serialNo?: string | null | undefined;
    prime?: boolean | undefined;
    blacklisted?: boolean | undefined;
    connector?: boolean | undefined;
    remark?: string | undefined;
    adminCustomFields?: Record<string, any> | undefined;
    joiningDate?: string | undefined;
    hasReference?: boolean | undefined;
    partnerId?: string | null | undefined;
    motherCompanyId?: string | null | undefined;
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
    purchaseDate?: string | undefined;
    renewal?: boolean | undefined;
    expiryDate?: string | undefined;
    renewalDate?: string | undefined;
    detail?: string | undefined;
}, {
    status?: boolean | undefined;
    purchaseDate?: string | undefined;
    renewal?: boolean | undefined;
    expiryDate?: string | undefined;
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
        offerType: "fixed" | "free_trial" | "percentage";
        value?: number | undefined;
        startsAt?: string | undefined;
        endsAt?: string | undefined;
    }, {
        offerType: "fixed" | "free_trial" | "percentage";
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
        offerType: "fixed" | "free_trial" | "percentage";
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
        offerType: "fixed" | "free_trial" | "percentage";
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
export declare const addFeedbackSchema: z.ZodObject<{
    rating: z.ZodOptional<z.ZodString>;
    feedback: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    feedback?: string | undefined;
    rating?: string | undefined;
}, {
    feedback?: string | undefined;
    rating?: string | undefined;
}>;
export type AddFeedbackSchema_ = z.infer<typeof addFeedbackSchema>;
export declare const purchaseSubscriptionSchema: z.ZodObject<{
    planId: z.ZodString;
    currency: z.ZodString;
    paymentMethod: z.ZodString;
    transactionId: z.ZodString;
    accountHolder: z.ZodString;
    paymentImage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    planId: string;
    currency: string;
    paymentMethod: string;
    transactionId: string;
    accountHolder: string;
    paymentImage?: string | undefined;
}, {
    planId: string;
    currency: string;
    paymentMethod: string;
    transactionId: string;
    accountHolder: string;
    paymentImage?: string | undefined;
}>;
export type PurchaseSubscriptionSchema_ = z.infer<typeof purchaseSubscriptionSchema>;
