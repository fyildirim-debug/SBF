import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getAuthSecret } from "@/lib/auth-secret";

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
    secret: getAuthSecret(),
    // Kendi sunucumuzda (reverse proxy / doğrudan port) çalışır; AUTH_URL tanımlı olmasa da Host başlığına güven
    trustHost: true,
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

                return null;
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            // Token'dan user id'yi session'a ekle
            if (token.sub && session.user) {
                // Session user nesnesine id ekle
                Object.assign(session.user, { id: token.sub });
            }
            return session;
        },
    },
});
