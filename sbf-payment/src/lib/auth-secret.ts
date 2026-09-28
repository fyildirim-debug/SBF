import { createHash, randomBytes } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Repoda açığa çıkmış secret değerlerinin SHA-256 özetleri — bunlar asla kabul edilmez
const LEAKED_SECRET_HASHES = new Set([
    "c31883154d61d3ba4a50a827cfff93f6e4d335740fdce1372c72e2715b1d82c9",
    "9452fae53e99c72a841657f3d77d0dea61d389a9d79f4bffd92f56ca27f7ded3",
    "6653dc94241f8710f78767d14905ae727206c220f8d3e0752bf3cd2969b09b28",
]);

const MIN_SECRET_LENGTH = 32;
const SECRET_FILE = join(process.cwd(), ".auth-secret");

let cachedSecret: string | null = null;

function isUsable(secret: string | undefined): secret is string {
    if (!secret || secret.length < MIN_SECRET_LENGTH) return false;
    const hash = createHash("sha256").update(secret).digest("hex");
    return !LEAKED_SECRET_HASHES.has(hash);
}

function readSecretFile(): string | undefined {
    try {
        return readFileSync(SECRET_FILE, "utf-8").trim();
    } catch {
        return undefined;
    }
}

// Oturum ve captcha imzası için kullanılan secret.
// Önce AUTH_SECRET / NEXTAUTH_SECRET okunur; yoksa, kısaysa ya da sızmış bir değerse
// uygulama klasöründeki .auth-secret dosyası kullanılır (yoksa rastgele üretilir).
export function getAuthSecret(): string {
    if (cachedSecret) return cachedSecret;

    const envSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (isUsable(envSecret)) {
        cachedSecret = envSecret;
        return cachedSecret;
    }

    if (envSecret) {
        console.warn("[auth] AUTH_SECRET kısa ya da güvensiz; .auth-secret dosyası kullanılacak.");
    }

    let fileSecret = readSecretFile();
    if (!isUsable(fileSecret)) {
        const generated = randomBytes(48).toString("base64url");
        try {
            // wx: başka bir süreç aynı anda oluşturduysa üzerine yazma
            writeFileSync(SECRET_FILE, generated, { flag: "wx", mode: 0o600 });
            fileSecret = generated;
        } catch {
            fileSecret = readSecretFile();
        }
    }

    if (!isUsable(fileSecret)) {
        throw new Error("Oturum secret'ı oluşturulamadı. AUTH_SECRET ortam değişkenini en az 32 karakter olarak ayarlayın.");
    }

    cachedSecret = fileSecret;
    return cachedSecret;
}
