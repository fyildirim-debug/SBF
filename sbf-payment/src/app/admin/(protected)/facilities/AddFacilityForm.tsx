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
                    <Label htmlFor="sbfStudentPrice">SBF Öğrenci (TL)</Label>
                    <Input id="sbfStudentPrice" name="sbfStudentPrice" type="number" min="0" step="0.5" placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="externalStudentPrice">Kurum İçi Öğrenci (TL)</Label>
                    <Input id="externalStudentPrice" name="externalStudentPrice" type="number" min="0" step="0.5" placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="academicStaffPrice">Akademik Personel (TL)</Label>
                    <Input id="academicStaffPrice" name="academicStaffPrice" type="number" min="0" step="0.5" placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="adminStaffPrice">İdari Personel (TL)</Label>
                    <Input id="adminStaffPrice" name="adminStaffPrice" type="number" min="0" step="0.5" placeholder="0.00" required />
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
