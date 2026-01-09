"use client";

import { deleteFacility } from "../../actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";

export function DeleteFacilityButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition();

    return (
        <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            disabled={isPending}
            onClick={() => {
                if (confirm("Bu tesisi silmek istediğinize emin misiniz?")) {
                    startTransition(async () => {
                        await deleteFacility(id);
                    });
                }
            }}
        >
            <Trash2 className="w-5 h-5" />
        </Button>
    );
}
