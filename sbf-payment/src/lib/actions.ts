'use server';

import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { AuthState } from "@/lib/types";

export async function setupAdmin(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password || password.length < 6) {
        return { error: "Geçersiz email veya şifre (min 6 karakter)." };
    }

    try {
        const userCount = await prisma.user.count();
        if (userCount > 0) {
            return { error: "Sistemde zaten yönetici var. Giriş yapınız." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: "Yönetici",
                role: "admin"
            }
        });

        return { success: true };

    } catch (error) {
        console.error("Setup error:", error);
        return { error: "Kurulum hatası." };
    }
}

export async function authenticate(
    prevState: AuthState | undefined,
    formData: FormData,
): Promise<AuthState> {

    // CAPTCHA doğrulaması (server-side)
    const captchaToken = formData.get('captchaToken') as string;
    const captchaAnswer = formData.get('captchaAnswer') as string;

    if (!captchaToken || !captchaAnswer) {
        return { error: 'Güvenlik doğrulaması eksik.' };
    }
    try {
        const decoded = Buffer.from(captchaToken, 'base64').toString('utf-8');
        const [expectedAnswer, tokenTimestamp] = decoded.split(':');
        const currentTimestamp = Math.floor(Date.now() / 60000);
        const tokenAge = currentTimestamp - parseInt(tokenTimestamp, 10);

        if (tokenAge > 5) {
            return { error: 'Güvenlik sorusu süresi doldu. Lütfen sayfayı yenileyiniz.' };
        }
        if (parseInt(captchaAnswer, 10) !== parseInt(expectedAnswer, 10)) {
            return { error: 'Güvenlik doğrulaması hatalı.' };
        }
    } catch {
        return { error: 'Güvenlik doğrulaması geçersiz.' };
    }

    try {
        await signIn('credentials', {
            email: formData.get('email'),
            password: formData.get('password'),
            redirect: false,
        });
        return { success: true };
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return { error: 'Hatalı e-posta veya şifre.' };
                default:
                    return { error: 'Bir sorun oluştu.' };
            }
        }

        // Next.js Redirect Hatası Kontrolü
        if (error && typeof error === 'object' && 'digest' in error) {
            const digest = (error as { digest?: string }).digest;
            if (digest?.startsWith?.('NEXT_REDIRECT')) {
                return { success: true };
            }
        }

        throw error;
    }
}
