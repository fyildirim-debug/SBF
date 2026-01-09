'use client';

import { useState } from 'react';
import { setupAdmin } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SetupForm() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [pending, setPending] = useState(false);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setPending(true);
        setError(null);

        const result = await setupAdmin(formData);

        if (result.error) {
            setError(result.error);
            setPending(false);
        } else {
            setSuccess(true);
            // Kısa bir süre sonra yenile
            setTimeout(() => {
                router.refresh();
            }, 1500);
        }
    }

    if (success) {
        return (
            <div className="text-center p-4">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-green-700">Yönetici Hesabı Oluşturuldu!</h3>
                <p className="text-sm text-gray-500">Giriş ekranına yönlendiriliyorsunuz...</p>
            </div>
        )
    }

    return (
        <form action={handleSubmit} className="space-y-4">
            <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100">
                Sistemde kayıtlı yönetici bulunamadı. Lütfen ilk yönetici hesabını oluşturun.
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Yönetici E-posta</Label>
                <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="admin@ankara.edu.tr"
                    required
                    className="bg-white/50"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Yönetici Şifre</Label>
                <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="En az 6 karakter"
                    required
                    minLength={6}
                    className="bg-white/50"
                />
            </div>

            {error && (
                <div className="w-full p-2 text-sm text-red-500 bg-red-50 rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <p>{error}</p>
                </div>
            )}

            <Button className="w-full bg-[#cf9d34] hover:bg-[#cf9d34]/90 text-[#152746] font-semibold" disabled={pending}>
                {pending ? 'Oluşturuluyor...' : 'Hesabı Oluştur ve Devam Et'}
            </Button>
        </form>
    );
}
