"use client";

import { useRef } from "react";
import { addFacility } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Ekleniyor..." : (
                <>
                    <PlusCircle className="w-4 h-4 mr-2" /> Tesis Ekle
                </>
            )}
        </Button>
    );
}

export function AddFacilityForm() {
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <form
            ref={formRef}
            action={async (formData) => {
                await addFacility(formData);
                formRef.current?.reset();
            }}
            className="space-y-4"
        >
            <div className="space-y-2">
                <Label htmlFor="name">Tesis Adı</Label>
                <Input id="name" name="name" placeholder="Örn: Kapalı Yüzme Havuzu" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label htmlFor="studentPrice">Öğrenci Ücreti (TL)</Label>
                    <Input id="studentPrice" name="studentPrice" type="number" min="0" step="0.5" placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="staffPrice">Personel Ücreti (TL)</Label>
                    <Input id="staffPrice" name="staffPrice" type="number" min="0" step="0.5" placeholder="0.00" required />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Açıklama (İsteğe bağlı)</Label>
                <Input id="description" name="description" placeholder="Kısa bilgi..." />
            </div>

            <div className="pt-2">
                <SubmitButton />
            </div>
        </form>
    );
}
