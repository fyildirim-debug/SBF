"use client";

import { deleteFormField, toggleFormFieldActive } from "../../form-actions";
import { Button } from "@/components/ui/button";

import { Trash2, Eye, EyeOff } from "lucide-react";
import { useTransition } from "react";

// Badge bileşenini burada inline tanımlayalım hızlıca
function Badge({ variant = "default", children }: { variant?: "default" | "secondary" | "destructive", children: React.ReactNode }) {
    const classes = {
        default: "bg-primary/10 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-red-100 text-red-700"
    }
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${classes[variant]}`}>{children}</span>
}

export function FormFieldList({ fields }: { fields: any[] }) {
    return (
        <div className="space-y-4">
            {fields.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">Ekstra form alanı bulunmuyor.</div>
            ) : (
                <div className="grid gap-3">
                    {fields.map((field) => (
                        <div key={field.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/20 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${field.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                                <div>
                                    <div className="font-medium">{field.label}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary">{field.type}</Badge>
                                        {!field.isActive && <Badge variant="destructive">Pasif</Badge>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <ToggleActiveButton id={field.id} isActive={field.isActive} />
                                <DeleteFieldButton id={field.id} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function DeleteFieldButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition();
    return (
        <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            disabled={isPending}
            onClick={() => {
                if (confirm("Bu alanı silmek istediğinize emin misiniz?")) {
                    startTransition(async () => {
                        await deleteFormField(id);
                    });
                }
            }}
        >
            <Trash2 className="w-4 h-4" />
        </Button>
    )
}

function ToggleActiveButton({ id, isActive }: { id: string, isActive: boolean }) {
    const [isPending, startTransition] = useTransition();
    return (
        <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            disabled={isPending}
            onClick={() => {
                startTransition(async () => {
                    await toggleFormFieldActive(id, isActive);
                });
            }}
            title={isActive ? "Pasif Yap" : "Aktif Yap"}
        >
            {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </Button>
    )
}
