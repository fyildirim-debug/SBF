'use client';

import { useFormStatus } from 'react-dom';
import { authenticate } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { useEffect, useActionState } from 'react';

export function LoginForm() {
    const [state, dispatch] = useActionState(authenticate, undefined);

    useEffect(() => {
        if (state?.success) {
            window.location.href = '/admin';
        }
    }, [state]);

    return (
        <form action={dispatch} className="space-y-4">
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
            <div
                className="flex h-8 items-end space-x-1"
                aria-live="polite"
                aria-atomic="true"
            >
                {state?.error && (
                    <div className="w-full p-2 text-sm text-red-500 bg-red-50 rounded flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <p>{state.error}</p>
                    </div>
                )}
            </div>
            <LoginButton />
        </form>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <Button className="w-full bg-[#152746] hover:bg-[#152746]/90 text-white" aria-disabled={pending} disabled={pending}>
            {pending ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
        </Button>
    );
}
