import { createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { getAuthSecret } from "@/lib/auth-secret";

// Matematik captcha'sı sunucuda üretilir ve HMAC ile imzalanır.
// Token cevabı içermez; her token tek kullanımlıktır (yanlış cevapta da geçersiz olur).

export type CaptchaOperator = "+" | "-" | "×";

export interface CaptchaChallenge {
    a: number;
    b: number;
    operator: CaptchaOperator;
    token: string;
}

export type CaptchaResult = { ok: true } | { ok: false; error: string };

// Onay dökümanlarını okumaya zaman tanımak için 15 dakika
const TTL_MS = 15 * 60 * 1000;

const globalStore = globalThis as unknown as { __sbfCaptchaUsed?: Map<string, number> };
const usedNonces = (globalStore.__sbfCaptchaUsed ??= new Map<string, number>());

function signingKey(): Buffer {
    return createHmac("sha256", getAuthSecret()).update("sbf-captcha").digest();
}

function sign(answer: number, exp: number, nonce: string): string {
    return createHmac("sha256", signingKey()).update(`${answer}|${exp}|${nonce}`).digest("base64url");
}

export function createCaptcha(): CaptchaChallenge {
    const operators: CaptchaOperator[] = ["+", "-", "×"];
    const operator = operators[randomInt(operators.length)];
    let a: number, b: number, answer: number;

    switch (operator) {
        case "+":
            a = randomInt(1, 21);
            b = randomInt(1, 21);
            answer = a + b;
            break;
        case "-":
            a = randomInt(10, 30);
            b = randomInt(1, a + 1);
            answer = a - b;
            break;
        default:
            a = randomInt(2, 11);
            b = randomInt(2, 11);
            answer = a * b;
    }

    const exp = Date.now() + TTL_MS;
    const nonce = randomBytes(12).toString("base64url");
    return { a, b, operator, token: `${exp}.${nonce}.${sign(answer, exp, nonce)}` };
}

function purgeExpired() {
    const now = Date.now();
    for (const [nonce, exp] of usedNonces) {
        if (exp <= now) usedNonces.delete(nonce);
    }
}

export function verifyCaptcha(token: string | null, answerRaw: string | null): CaptchaResult {
    if (!token || !answerRaw) {
        return { ok: false, error: "Güvenlik doğrulaması eksik." };
    }

    const [expStr, nonce, signature, ...rest] = token.split(".");
    const exp = Number(expStr);
    if (!nonce || !signature || rest.length > 0 || !Number.isFinite(exp)) {
        return { ok: false, error: "Güvenlik doğrulaması geçersiz. Lütfen yeni soruyu çözünüz." };
    }

    purgeExpired();
    if (Date.now() > exp) {
        return { ok: false, error: "Güvenlik sorusunun süresi doldu. Lütfen yeni soruyu çözünüz." };
    }
    if (usedNonces.has(nonce)) {
        return { ok: false, error: "Bu güvenlik sorusu zaten kullanıldı. Lütfen yeni soruyu çözünüz." };
    }
    usedNonces.set(nonce, exp);

    const answer = Number.parseInt(answerRaw.trim(), 10);
    const expected = Buffer.from(Number.isInteger(answer) ? sign(answer, exp, nonce) : "");
    const given = Buffer.from(signature);
    if (expected.length === 0 || expected.length !== given.length || !timingSafeEqual(expected, given)) {
        return { ok: false, error: "Güvenlik doğrulaması hatalı. Lütfen yeni soruyu çözünüz." };
    }

    return { ok: true };
}
