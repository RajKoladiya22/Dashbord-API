import { PrismaClient } from '@prisma/client';
export declare const env: NodeJS.ProcessEnv;
declare global {
    var __globalPrisma: PrismaClient | undefined;
}
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare function shutdownDb(): Promise<void>;
