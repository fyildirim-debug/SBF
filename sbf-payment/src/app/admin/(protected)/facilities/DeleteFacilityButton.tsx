"use client";

import { deleteFacility } from "../../actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useTransition, useState } from "react";

export function DeleteFacilityButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                disabled={isPending}
                onClick={() => {
                    if (confirm("Bu tesisi silmek istediğinize emin misiniz?")) {
                        setError(null);
                        startTransition(async () => {
                            const result = await deleteFacility(id);
                            if (result.error) {
                                setError(result.error);
                                // 5 saniye sonra hata mesajını temizle
                                setTimeout(() => setError(null), 5000);
                            }
                        });
                    }
                }}
            >
                <Trash2 className="w-5 h-5" />
            </Button>
            {error && (
                <div className="absolute right-0 top-full mt-2 z-10 p-3 bg-red-50 border border-red-200 rounded-lg shadow-lg text-sm text-red-700 min-w-[280px] max-w-[350px]">
                    {error}
                </div>
            )}
        </div>
    );
}
