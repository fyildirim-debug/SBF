"use client";

import { useRef } from "react";
import { addFormField } from "../../form-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select"; // Benim yazdığım wrapper
import { PlusCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Ekleniyor..." : (
                <>
                    <PlusCircle className="w-4 h-4 mr-2" /> Alan Ekle
                </>
            )}
        </Button>
    );
}

export function AddFormFieldForm() {
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <form
            ref={formRef}
            action={async (formData) => {
                await addFormField(formData);
                formRef.current?.reset();
            }}
            className="space-y-4"
        >
            <div className="space-y-2">
                <Label htmlFor="label">Soru Başlığı / Etiket</Label>
                <Input id="label" name="label" placeholder="Örn: Telefon Numarası" required />
            </div>

            <div className="space-y-2">
                <Label htmlFor="type">Veri Tipi</Label>
                <Select id="type" name="type" required>
                    <option value="text">Metin (Kısa)</option>
                    <option value="number">Sayı</option>
                    <option value="date">Tarih</option>
                    <option value="select">Seçim Listesi</option>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="options">Seçenekler (Sadece Seçim Listesi için)</Label>
                <Input id="options" name="options" placeholder="Evet, Hayır, Belki" />
                <p className="text-xs text-muted-foreground">Virgülle ayırarak yazınız.</p>
            </div>

            <div className="pt-2">
                <SubmitButton />
            </div>
        </form>
    );
}
