import { prisma } from "@/lib/prisma";
import { LoginForm } from "./LoginForm";
import { SetupForm } from "./SetupForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LockKeyhole, ShieldCheck } from 'lucide-react';

export default async function LoginPage() {
    const userCount = await prisma.user.count();
    const isSetupMode = userCount === 0;

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-2 bg-[#cf9d34] z-50" />
            <div className="absolute top-0 w-full h-1/2 bg-[#152746] -z-10" />

            <Card className="w-full max-w-md bg-white border border-gray-200 shadow-2xl mt-10">
                <CardHeader className="space-y-1 text-center pb-2">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 rounded-full bg-gray-100 border-4 border-white shadow-sm">
                            {isSetupMode ?
                                <ShieldCheck className="w-8 h-8 text-[#cf9d34]" /> :
                                <LockKeyhole className="w-8 h-8 text-[#152746]" />
                            }
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-[#152746]">
                        {isSetupMode ? "Sistem Kurulumu" : "Yönetici Girişi"}
                    </CardTitle>
                    <CardDescription>
                        Ankara Üniversitesi SBF Yönetim Paneli
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isSetupMode ? <SetupForm /> : <LoginForm />}
                </CardContent>
            </Card>

            <div className="absolute bottom-4 text-center w-full text-xs text-gray-400">
                &copy; {new Date().getFullYear()} Ankara Üniversitesi
            </div>
        </div>
    );
}
