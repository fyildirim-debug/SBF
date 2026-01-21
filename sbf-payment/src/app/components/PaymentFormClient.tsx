"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { submitPayment } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PDFConsentModal } from "./PDFConsentModal";

interface Facility {
    id: string;
    name: string;
    price: number;
}

interface FormField {
    id: string;
    name: string;
    label: string;
    type: string;
    required: boolean;
    options: string | null;
}

interface PaymentFormClientProps {
    facilities: Facility[];
    extraFields: FormField[];
}

// Form veri tipi
interface PaymentFormData {
    tcNo: string;
    fullName: string;
    studentNo: string;
    facilityId: string;
    receipt: FileList;
    [key: string]: string | FileList; // Dinamik alanlar için
}

// Consent veri tipi
interface ConsentData {
    documentName: string;
    consentAt: string;
    ipAddress: string;
    userAgent: string;
}

// Onaylanacak PDF dökümanları
const PDF_DOCUMENTS = [
    {
        name: "FITNESS SALONU ÜYELİK BAŞVURUSU",
        title: "Fitness Salonu Üyelik Başvurusu",
        path: "/documents/FITNESS SALONU ÜYELİK BAŞVURUSU.pdf",
    },
    {
        name: "FITNESS SALONU KULLANIM KURALLARI",
        title: "Fitness Salonu Kullanım Kuralları",
        path: "/documents/FITNESS SALONU KULLANIM KURALLARI.pdf",
    },
];

export function PaymentFormClient({ facilities, extraFields }: PaymentFormClientProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<{ success?: boolean; error?: string } | null>(null);
    const [showConsentModal, setShowConsentModal] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<PaymentFormData | null>(null);
    const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<PaymentFormData>();

    const selectedFacilityId = watch("facilityId");
    const selectedFacility = facilities.find(f => f.id === selectedFacilityId);

    // Form submit edildiğinde önce PDF onay modal'ını aç
    function onFormSubmit(data: PaymentFormData) {
        setPendingFormData(data);
        setShowConsentModal(true);
    }

    // PDF onayları tamamlandığında formu gönder
    async function handleConsentComplete(consents: ConsentData[]) {
        setShowConsentModal(false);

        if (!pendingFormData) return;

        setIsSubmitting(true);
        setSubmitResult(null);

        const formData = new FormData();
        // Sabit alanlar
        formData.append("tcNo", pendingFormData.tcNo);
        formData.append("fullName", pendingFormData.fullName);
        formData.append("studentNo", pendingFormData.studentNo);
        formData.append("facilityId", pendingFormData.facilityId);
        if (pendingFormData.receipt[0]) {
            formData.append("receipt", pendingFormData.receipt[0]);
        }

        // Consent verilerini JSON olarak ekle
        formData.append("consents", JSON.stringify(consents));

        // Dinamik alanları da ekle
        if (extraFields) {
            extraFields.forEach(field => {
                const fieldValue = pendingFormData[field.name];
                if (fieldValue && typeof fieldValue === 'string') {
                    formData.append(field.name, fieldValue);
                }
            });
        }

        try {
            const result = await submitPayment(formData);
            if (result.error) {
                setSubmitResult({ error: result.error });
            } else {
                setSubmitResult({ success: true });
                reset();
                setPendingFormData(null);
            }
        } catch (error) {
            console.error("Form gönderim hatası:", error);
            setSubmitResult({ error: "Beklenmedik bir hata oluştu." });
        } finally {
            setIsSubmitting(false);
        }
    }

    // Modal kapatıldığında
    function handleConsentClose() {
        setShowConsentModal(false);
        setPendingFormData(null);
    }

    if (submitResult?.success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-8 bg-green-50 rounded-2xl border border-green-100"
            >
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-700 mb-2">Başvuru Alındı!</h3>
                <p className="text-green-600 mb-6">
                    Ödeme bildiriminiz başarıyla sisteme kaydedildi.
                </p>
                <Button
                    variant="outline"
                    className="border-green-600 text-green-700 hover:bg-green-50"
                    onClick={() => setSubmitResult(null)}
                >
                    Yeni Başvuru Yap
                </Button>
            </motion.div>
        );
    }

    return (
        <>
            {/* PDF Onay Modal'ı */}
            <PDFConsentModal
                isOpen={showConsentModal}
                onComplete={handleConsentComplete}
                onClose={handleConsentClose}
                documents={PDF_DOCUMENTS}
            />

            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="tcNo" className="text-gray-700 font-medium">T.C. Kimlik Numarası</Label>
                        <Input
                            id="tcNo"
                            placeholder="11 haneli T.C. No"
                            maxLength={11}
                            className="bg-white border-gray-300 focus:border-[#152746] focus:ring-[#152746] h-11"
                            {...register("tcNo", { required: true, minLength: 11, maxLength: 11 })}
                        />
                        {errors.tcNo && <span className="text-sm text-red-500">T.C. Kimlik No zorunludur (11 hane)</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="studentNo" className="text-gray-700 font-medium">Öğrenci Numarası</Label>
                        <Input
                            id="studentNo"
                            placeholder="Okul Numaranız"
                            className="bg-white border-gray-300 focus:border-[#152746] focus:ring-[#152746] h-11"
                            {...register("studentNo", { required: true })}
                        />
                        {errors.studentNo && <span className="text-sm text-red-500">Öğrenci No zorunludur</span>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-gray-700 font-medium">Adı Soyadı</Label>
                    <Input
                        id="fullName"
                        placeholder="Adınız ve Soyadınız"
                        className="bg-white border-gray-300 focus:border-[#152746] focus:ring-[#152746] h-11"
                        {...register("fullName", { required: true })}
                    />
                    {errors.fullName && <span className="text-sm text-red-500">Ad Soyad zorunludur</span>}
                </div>

                {/* Dinamik Alanlar */}
                {extraFields && extraFields.map((field) => (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.name} className="text-gray-700 font-medium">{field.label}</Label>
                        {field.type === 'text' && (
                            <Input
                                id={field.name}
                                className="bg-white border-gray-300 focus:border-[#152746] focus:ring-[#152746] h-11"
                                {...register(field.name, { required: field.required })}
                            />
                        )}
                        {field.type === 'number' && (
                            <Input
                                id={field.name}
                                type="number"
                                className="bg-white border-gray-300 focus:border-[#152746] focus:ring-[#152746] h-11"
                                {...register(field.name, { required: field.required })}
                            />
                        )}
                        {field.type === 'date' && (
                            <Input
                                id={field.name}
                                type="date"
                                className="bg-white border-gray-300 focus:border-[#152746] focus:ring-[#152746] h-11"
                                {...register(field.name, { required: field.required })}
                            />
                        )}
                        {field.type === 'select' && field.options && (
                            <Select
                                id={field.name}
                                className="bg-white border-gray-300 focus:border-[#152746] focus:ring-[#152746] h-11"
                                {...register(field.name, { required: field.required })}
                            >
                                <option value="">Seçiniz</option>
                                {(JSON.parse(field.options) as string[]).map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                ))}
                            </Select>
                        )}
                    </div>
                ))}

                <div className="space-y-2">
                    <Label htmlFor="facilityId" className="text-gray-700 font-medium">Kullanılacak Tesis</Label>
                    <Select
                        id="facilityId"
                        className="bg-white border-gray-300 focus:border-[#152746] focus:ring-[#152746] h-11"
                        {...register("facilityId", { required: true })}
                    >
                        <option value="">Seçiniz...</option>
                        {facilities.map((f) => (
                            <option key={f.id} value={f.id}>
                                {f.name} - {f.price} TL
                            </option>
                        ))}
                    </Select>
                    {errors.facilityId && <span className="text-sm text-red-500">Lütfen bir tesis seçiniz</span>}
                </div>

                <AnimatePresence>
                    {selectedFacility && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-[#152746]/5 rounded-lg p-4 border border-[#152746]/10"
                        >
                            <div className="flex justify-between items-center text-[#152746] font-medium">
                                <span>Ödenecek Tutar:</span>
                                <span className="text-xl font-bold">{selectedFacility.price} TL</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-2">
                    <Label htmlFor="receipt" className="text-gray-700 font-medium">Dekont Yükle (PDF veya Fotoğraf)</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:bg-gray-50 hover:border-[#152746]/50 transition-colors text-center cursor-pointer relative bg-white">
                        <input
                            type="file"
                            id="receipt"
                            accept="image/*,.pdf"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            {...register("receipt", { required: true })}
                        />
                        <div className="flex flex-col items-center gap-2 text-gray-500 pointer-events-none">
                            <Upload className="w-10 h-10 text-[#152746]/50" />
                            <span className="text-sm font-medium">Dosya seçmek için tıklayın veya sürükleyin</span>
                        </div>
                    </div>
                    {errors.receipt && <span className="text-sm text-red-500">Dekont yüklemek zorunludur</span>}
                </div>

                {submitResult?.error && (
                    <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm flex items-center gap-2 border border-red-100">
                        <AlertCircle className="w-4 h-4" />
                        {submitResult.error}
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full text-lg h-12 bg-[#152746] hover:bg-[#152746]/90 text-white transition-all font-semibold shadow-md hover:shadow-lg"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Gönderiliyor..." : "Ödeme Bildirimini Gönder"}
                </Button>
            </form>
        </>
    );
}
