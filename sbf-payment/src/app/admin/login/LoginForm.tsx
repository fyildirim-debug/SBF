'use client';

import { useState } from 'react';
import { authenticate } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { MathCaptcha } from '@/app/components/MathCaptcha';

export function LoginForm() {
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);
    const [captchaValid, setCaptchaValid] = useState(false);
    const [captchaToken, setCaptchaToken] = useState('');
    const [captchaAnswer, setCaptchaAnswer] = useState('');

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!captchaValid) {
            setError('Lütfen güvenlik doğrulamasını tamamlayınız.');
            return;
        }

        setPending(true);
        setError(null);

        const formEl = e.currentTarget;
        const formData = new FormData(formEl);
        formData.append('captchaToken', captchaToken);
        formData.append('captchaAnswer', captchaAnswer);

        try {
            const result = await authenticate(undefined, formData);

            if (result?.success) {
                window.location.href = '/admin';
            } else {
                setError(result?.error ?? 'Bir sorun oluştu.');
                setPending(false);
            }
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (errorMsg.includes("Server Action") || errorMsg.includes("Failed to find")) {
                setError('Sayfa güncel değil. Lütfen sayfayı yenileyiniz (Ctrl+F5).');
            } else {
                setError('Beklenmedik bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyiniz.');
            }
            setPending(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">E-posta Adresi</Label>
                <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="ornek@ankara.edu.tr"
                    required
                    className="bg-white/50"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <Input
                    id="password"
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    className="bg-white/50"
                />
            </div>

            {/* Matematik CAPTCHA */}
            <MathCaptcha
                onValidChange={(isValid, token, answer) => {
                    setCaptchaValid(isValid);
                    setCaptchaToken(token);
                    setCaptchaAnswer(answer);
                }}
            />

            {error && (
                <div className="w-full p-2 text-sm text-red-500 bg-red-50 rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <Button
                type="submit"
                className={`w-full transition-all font-semibold
                    ${captchaValid && !pending
                        ? 'bg-[#152746] hover:bg-[#152746]/90 text-white cursor-pointer'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                disabled={pending || !captchaValid}
            >
                {pending ? 'Giriş Yapılıyor...' : captchaValid ? 'Giriş Yap' : '🔒 Güvenlik doğrulamasını tamamlayın'}
            </Button>
        </form>
    );
}
