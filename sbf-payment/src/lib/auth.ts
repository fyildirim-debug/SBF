import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

async function getUser(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        return user;
    } catch (error) {
        console.error("Failed to fetch user:", error);
        throw new Error("Failed to fetch user.");
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    pages: {
        signIn: "/admin/login",
    },
    // Secret'ı hardcoded fallback olarak ekliyoruz çünkü env okunamazsa hata veriyor
    secret: process.env.NEXTAUTH_SECRET || "gizli-bir-super-secret-key-123456-change-me",
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (passwordsMatch) return user;
                }

                console.log("Invalid credentials");
                return null;
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            // Token'dan user id'yi session'a ekle
            if (token.sub && session.user) {
                // session.user.id normalde tiplerde yok, extend etmek gerekir ama şimdilik JS tarafında çalışır
                (session.user as any).id = token.sub;
            }
            return session;
        },
    },
});
