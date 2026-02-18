"use client";

import { useState, useTransition } from "react";
import { addAdmin, changeAdminPassword, deleteAdmin } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, KeyRound, Trash2, X, Check, Eye, EyeOff, UserPlus } from "lucide-react";

interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: Date;
}

// --- Admin ekleme formu ---
export function AddAdminForm() {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        startTransition(async () => {
            const result = await addAdmin(formData);
            if (result.error) {
                setMessage({ type: "error", text: result.error });
            } else {
                setMessage({ type: "success", text: "Yeni admin başarıyla eklendi." });
                form.reset();
            }
            setTimeout(() => setMessage(null), 4000);
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="adminName">Ad Soyad</Label>
                <Input id="adminName" name="name" placeholder="Ahmet Yılmaz" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="adminEmail">E-Posta</Label>
                <Input id="adminEmail" name="email" type="email" placeholder="admin@example.com" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="adminPassword">Şifre</Label>
                <Input id="adminPassword" name="password" type="password" placeholder="En az 6 karakter" minLength={6} required />
            </div>
            <Button type="submit" className="w-full bg-[#152746]" disabled={isPending}>
                <UserPlus className="w-4 h-4 mr-2" />
                {isPending ? "Ekleniyor..." : "Admin Ekle"}
            </Button>
            {message && (
                <p className={`text-sm mt-2 ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                    {message.text}
                </p>
            )}
        </form>
    );
}

// --- Admin kartı ---
export function AdminCard({ admin, currentUserId }: { admin: AdminUser; currentUserId?: string }) {
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const isSelf = admin.id === currentUserId;

    function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            const result = await changeAdminPassword(admin.id, formData);
            if (result.error) {
                setMessage({ type: "error", text: result.error });
            } else {
                setMessage({ type: "success", text: "Şifre başarıyla değiştirildi." });
                setShowPasswordForm(false);
            }
            setTimeout(() => setMessage(null), 4000);
        });
    }

    function handleDelete() {
        if (confirm(`${admin.name} adlı admin kullanıcıyı silmek istediğinize emin misiniz?`)) {
            startTransition(async () => {
                const result = await deleteAdmin(admin.id);
                if (result.error) {
                    setMessage({ type: "error", text: result.error });
                    setTimeout(() => setMessage(null), 5000);
                }
            });
        }
    }

    return (
        <div className="p-5 border rounded-xl bg-white space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#152746] flex items-center justify-center text-white font-bold text-sm">
                        {admin.name?.[0]?.toUpperCase() || "A"}
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900">
                            {admin.name}
                            {isSelf && <span className="ml-2 text-xs text-blue-500 font-normal">(Siz)</span>}
                        </h4>
                        <p className="text-sm text-gray-500">{admin.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {/* Şifre değiştir */}
                    <Button variant="ghost" size="icon" onClick={() => setShowPasswordForm(!showPasswordForm)} title="Şifre Değiştir">
                        <KeyRound className="w-4 h-4 text-amber-600" />
                    </Button>
                    {/* Sil (kendini silemez) */}
                    {!isSelf && (
                        <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isPending} className="text-red-500 hover:text-red-700 hover:bg-red-50" title="Sil">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Kayıt tarihi */}
            <p className="text-xs text-gray-400">
                Kayıt: {new Date(admin.createdAt).toLocaleDateString("tr-TR")}
            </p>

            {/* Şifre değiştirme formu */}
            {showPasswordForm && (
                <form onSubmit={handleChangePassword} className="bg-amber-50/50 border border-amber-200 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-medium text-amber-800">Şifre Değiştir — {admin.name}</p>
                    <div className="space-y-1">
                        <Label className="text-xs">Yeni Şifre</Label>
                        <div className="relative">
                            <Input
                                name="newPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="En az 6 karakter"
                                minLength={6}
                                required
                            />
                            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Şifre Tekrar</Label>
                        <Input name="confirmPassword" type="password" placeholder="Aynı şifreyi tekrar girin" required />
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" type="submit" disabled={isPending} className="bg-amber-600 hover:bg-amber-700">
                            <Check className="w-4 h-4 mr-1" /> Değiştir
                        </Button>
                        <Button size="sm" variant="ghost" type="button" onClick={() => setShowPasswordForm(false)}>
                            <X className="w-4 h-4 mr-1" /> İptal
                        </Button>
                    </div>
                </form>
            )}

            {message && (
                <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                    {message.text}
                </p>
            )}
        </div>
    );
}
