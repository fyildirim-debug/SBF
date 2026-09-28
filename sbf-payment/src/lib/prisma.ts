import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        // Production'da sorgular (kişisel veri içerir) loglanmaz
        log: process.env.NODE_ENV === "production" ? ["error"] : ["query"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
