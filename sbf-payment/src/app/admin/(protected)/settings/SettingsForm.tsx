"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateSettings } from "../../actions";
import { CheckCircle2, AlertCircle, Save } from "lucide-react";

interface SettingsFormProps {
    initialSettings: {
        applicationRules: string;
        usageTerms: string;
    };
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
    const [applicationRules, setApplicationRules] = useState(initialSettings.applicationRules);
    const [usageTerms, setUsageTerms] = useState(initialSettings.usageTerms);
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setResult(null);

        startTransition(async () => {
            const formData = new FormData();
            formData.append("applicationRules", applicationRules);
            formData.append("usageTerms", usageTerms);

            const response = await updateSettings(formData);
            setResult(response);

            // 3 saniye sonra başarı mesajını temizle
            if (response.success) {
                setTimeout(() => setResult(null), 3000);
            }
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="applicationRules" className="text-gray-700 font-medium">
                    Başvuru Kuralları
                </Label>
                <textarea
                    id="applicationRules"
                    value={applicationRules}
                    onChange={(e) => setApplicationRules(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#152746] focus:border-transparent resize-y"
                    placeholder="Başvuru kurallarını giriniz..."
                />
                <p className="text-sm text-gray-500">
                    Her satır yeni bir kural olarak görüntülenecektir.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="usageTerms" className="text-gray-700 font-medium">
                    Kullanım Şartları
                </Label>
                <textarea
                    id="usageTerms"
                    value={usageTerms}
                    onChange={(e) => setUsageTerms(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#152746] focus:border-transparent resize-y"
                    placeholder="Kullanım şartlarını giriniz..."
                />
                <p className="text-sm text-gray-500">
                    Her satır yeni bir şart olarak görüntülenecektir.
                </p>
            </div>

            {result?.success && (
                <div className="p-3 rounded-md bg-green-50 text-green-700 text-sm flex items-center gap-2 border border-green-100">
                    <CheckCircle2 className="w-4 h-4" />
                    Ayarlar başarıyla kaydedildi.
                </div>
            )}

            {result?.error && (
                <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm flex items-center gap-2 border border-red-100">
                    <AlertCircle className="w-4 h-4" />
                    {result.error}
                </div>
            )}

            <Button
                type="submit"
                className="bg-[#152746] hover:bg-[#152746]/90 text-white"
                disabled={isPending}
            >
                <Save className="w-4 h-4 mr-2" />
                {isPending ? "Kaydediliyor..." : "Ayarları Kaydet"}
            </Button>
        </form>
    );
}
