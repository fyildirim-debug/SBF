"use client";

import { useState, useTransition } from "react";
import { updateFacility, deleteFacility } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, X, Check, ToggleLeft, ToggleRight } from "lucide-react";

interface Facility {
    id: string;
    name: string;
    description: string | null;
    sbfStudentPrice: number;
    externalStudentPrice: number;
    academicStaffPrice: number;
    adminStaffPrice: number;
    isActive: boolean;
}

export function FacilityCard({ facility }: { facility: Facility }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // Düzenleme formu
    const [name, setName] = useState(facility.name);
    const [sbfStudentPrice, setSbfStudentPrice] = useState(facility.sbfStudentPrice.toString());
    const [externalStudentPrice, setExternalStudentPrice] = useState(facility.externalStudentPrice.toString());
    const [academicStaffPrice, setAcademicStaffPrice] = useState(facility.academicStaffPrice.toString());
    const [adminStaffPrice, setAdminStaffPrice] = useState(facility.adminStaffPrice.toString());
    const [description, setDescription] = useState(facility.description || "");

    function handleSave() {
        const formData = new FormData();
        formData.set("name", name);
        formData.set("sbfStudentPrice", sbfStudentPrice);
        formData.set("externalStudentPrice", externalStudentPrice);
        formData.set("academicStaffPrice", academicStaffPrice);
        formData.set("adminStaffPrice", adminStaffPrice);
        formData.set("description", description);
        formData.set("isActive", facility.isActive.toString());

        startTransition(async () => {
            const result = await updateFacility(facility.id, formData);
            if (result.error) {
                setError(result.error);
                setTimeout(() => setError(null), 5000);
            } else {
                setIsEditing(false);
            }
        });
    }

    function handleToggleActive() {
        const formData = new FormData();
        formData.set("name", facility.name);
        formData.set("sbfStudentPrice", facility.sbfStudentPrice.toString());
        formData.set("externalStudentPrice", facility.externalStudentPrice.toString());
        formData.set("academicStaffPrice", facility.academicStaffPrice.toString());
        formData.set("adminStaffPrice", facility.adminStaffPrice.toString());
        formData.set("description", facility.description || "");
        formData.set("isActive", (!facility.isActive).toString());

        startTransition(async () => {
            const result = await updateFacility(facility.id, formData);
            if (result.error) {
                setError(result.error);
                setTimeout(() => setError(null), 5000);
            }
        });
    }

    function handleDelete() {
        if (confirm("Bu tesisi silmek istediğinize emin misiniz?")) {
            startTransition(async () => {
                const result = await deleteFacility(facility.id);
                if (result.error) {
                    setError(result.error);
                    setTimeout(() => setError(null), 5000);
                }
            });
        }
    }

    if (isEditing) {
        return (
            <div className="p-6 border rounded-xl bg-blue-50/50 border-blue-200 space-y-3">
                <div className="space-y-2">
                    <Label className="text-xs text-gray-500">Tesis Adı</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">SBF Öğrenci (TL)</Label>
                        <Input type="number" min="0" step="0.5" value={sbfStudentPrice} onChange={e => setSbfStudentPrice(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Kurum İçi Öğrenci (TL)</Label>
                        <Input type="number" min="0" step="0.5" value={externalStudentPrice} onChange={e => setExternalStudentPrice(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Akademik Personel (TL)</Label>
                        <Input type="number" min="0" step="0.5" value={academicStaffPrice} onChange={e => setAcademicStaffPrice(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">İdari Personel (TL)</Label>
                        <Input type="number" min="0" step="0.5" value={adminStaffPrice} onChange={e => setAdminStaffPrice(e.target.value)} />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Açıklama</Label>
                    <Input value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={handleSave} disabled={isPending} className="bg-[#152746]">
                        <Check className="w-4 h-4 mr-1" /> Kaydet
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                        <X className="w-4 h-4 mr-1" /> İptal
                    </Button>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
        );
    }

    return (
        <div className={`p-6 border rounded-xl transition-all ${facility.isActive ? "bg-white" : "bg-gray-50 opacity-60"}`}>
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-semibold text-lg">{facility.name}</h4>
                    {facility.description && (
                        <p className="text-sm text-muted-foreground">{facility.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            SBF Öğr: {facility.sbfStudentPrice} TL
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                            Kurum Öğr: {facility.externalStudentPrice} TL
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Akademik: {facility.academicStaffPrice} TL
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            İdari: {facility.adminStaffPrice} TL
                        </span>
                        {!facility.isActive && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                Pasif
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {/* Aktif/Pasif toggle */}
                    <Button variant="ghost" size="icon" onClick={handleToggleActive} disabled={isPending} title={facility.isActive ? "Pasif yap" : "Aktif yap"}>
                        {facility.isActive
                            ? <ToggleRight className="w-5 h-5 text-green-500" />
                            : <ToggleLeft className="w-5 h-5 text-gray-400" />
                        }
                    </Button>
                    {/* Düzenle */}
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} title="Düzenle">
                        <Pencil className="w-4 h-4 text-gray-500" />
                    </Button>
                    {/* Sil */}
                    <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isPending} className="text-red-500 hover:text-red-700 hover:bg-red-50" title="Sil">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
            {error && <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
        </div>
    );
}
