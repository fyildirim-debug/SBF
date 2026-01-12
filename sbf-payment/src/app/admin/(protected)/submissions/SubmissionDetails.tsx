"use client";
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download } from "lucide-react";
import type { SerializedSubmission } from "@/lib/types";

export function SubmissionDetails({ submission }: { submission: SerializedSubmission }) {
    let extraData: Record<string, string> = {};
    try {
        if (submission.extraData) {
            extraData = JSON.parse(submission.extraData);
        }
    } catch (e) {
        console.error("JSON parse error", e);
    }

    return (
        <Dialog>
            <DialogTrigger>
                <Button size="sm" variant="outline" className="h-8 gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                    <FileText className="w-4 h-4" />
                    Detay
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-[#152746]">Başvuru Detayları</DialogTitle>
                    <DialogDescription>
                        {submission.fullName} - {submission.studentNo}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                    {/* Temel Bilgiler */}
                    <div className="space-y-2 p-3 bg-gray-50 rounded-md border text-sm">
                        <h4 className="font-semibold text-[#152746] border-b pb-1 mb-2">Temel Bilgiler</h4>
                        <div className="grid grid-cols-1 gap-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500">TC Kimlik:</span>
                                <span className="font-medium text-gray-900">{submission.tcNo}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tesis:</span>
                                <span className="font-medium text-gray-900">{submission.facility.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tutar:</span>
                                <span className="font-medium text-gray-900">{submission.facility.price} TL</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tarih:</span>
                                <span className="font-medium text-gray-900">{new Date(submission.createdAt).toLocaleDateString('tr-TR')} {new Date(submission.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Dinamik Alanlar */}
                    {Object.keys(extraData).length > 0 && (
                        <div className="space-y-2 p-3 bg-blue-50/50 rounded-md border border-blue-100 text-sm">
                            <h4 className="font-semibold text-[#152746] border-b border-blue-200 pb-1 mb-2">Form Yanıtları</h4>
                            <div className="grid grid-cols-1 gap-y-2">
                                {Object.entries(extraData).map(([key, value]) => {
                                    // Key'i (örn: "kac_yasindasin") daha düzgün göstermek mümkünse formField listesinden label aranabilir ama şu an key gösterelim
                                    // Veya key'i capitalize yapalım.
                                    return (
                                        <div key={key} className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                            <span className="text-gray-500 font-medium capitalize">{key}:</span>
                                            <span className="text-gray-900 break-all sm:text-right">{String(value)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Dekont */}
                    <div className="pt-2">
                        <a
                            href={submission.receiptPath}
                            target="_blank"
                            className="flex items-center justify-center w-full gap-2 p-2 rounded-md bg-[#152746] text-white hover:bg-[#152746]/90 transition-colors text-sm font-medium"
                        >
                            <Download className="w-4 h-4" />
                            Dekontu Görüntüle
                        </a>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
