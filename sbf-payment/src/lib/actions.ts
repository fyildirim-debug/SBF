'use server';

import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { AuthState } from "@/lib/types";
import { verifyCaptcha } from "@/lib/captcha";
import { getRequestInfo } from "@/lib/request-info";
import { clearFailures, isRateLimited, registerFailure } from "@/lib/rate-limit";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_IP_LIMIT = 20;
const LOGIN_ACCOUNT_LIMIT = 5;

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

    const email = String(formData.get('email') ?? '').trim();
    const { ip } = await getRequestInfo();
    const ipKey = `login-ip:${ip}`;
    const accountKey = `login-account:${email.toLowerCase()}`;

    // Kaba kuvvet koruması: IP başına ve hesap başına başarısız deneme sınırı
    if (isRateLimited(ipKey, LOGIN_IP_LIMIT) || isRateLimited(accountKey, LOGIN_ACCOUNT_LIMIT)) {
        return { error: 'Çok fazla başarısız deneme. Lütfen 15 dakika sonra tekrar deneyiniz.' };
    }

    // CAPTCHA doğrulaması (server-side, imzalı ve tek kullanımlık)
    const captcha = verifyCaptcha(
        formData.get('captchaToken') as string | null,
        formData.get('captchaAnswer') as string | null,
    );
    if (!captcha.ok) {
        registerFailure(ipKey, LOGIN_WINDOW_MS);
        return { error: captcha.error };
    }

    try {
        const resultUrl = await signIn('credentials', {
            email,
            password: formData.get('password'),
            redirect: false,
        });
        // Yapılandırma hatalarında signIn hata fırlatmaz, ?error=... içeren bir adres döner
        if (typeof resultUrl === 'string' && /[?&]error=/.test(resultUrl)) {
            console.error('Giriş başarısız, Auth.js yanıtı:', resultUrl);
            return { error: 'Giriş yapılamadı. Lütfen sistem yöneticisine başvurunuz.' };
        }
        clearFailures(accountKey);
        return { success: true };
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    registerFailure(ipKey, LOGIN_WINDOW_MS);
                    registerFailure(accountKey, LOGIN_WINDOW_MS);
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
