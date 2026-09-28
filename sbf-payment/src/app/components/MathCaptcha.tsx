"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CaptchaQuestion {
    a: number;
    b: number;
    operator: "+" | "-" | "×";
    token: string;
}

interface MathCaptchaProps {
    // Soru sunucuda imzalanır; cevabın doğruluğu form gönderilince sunucuda kontrol edilir.
    // Her gönderimden sonra yeni soru için bileşen `key` değiştirilerek yeniden oluşturulur.
    onChange: (token: string, userAnswer: string) => void;
}

export function MathCaptcha({ onChange }: MathCaptchaProps) {
    const [question, setQuestion] = useState<CaptchaQuestion | null>(null);
    const [userAnswer, setUserAnswer] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    // onChange'i ref'te tut — dependency array sorununu önler
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    });

    const fetchQuestion = useCallback(async () => {
        try {
            const res = await fetch("/api/captcha", { cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const q = (await res.json()) as CaptchaQuestion;
            setQuestion(q);
            setUserAnswer("");
            setLoadError(false);
            onChangeRef.current(q.token, "");
        } catch {
            setQuestion(null);
            setLoadError(true);
            onChangeRef.current("", "");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchQuestion();
    }, [fetchQuestion]);

    function refresh() {
        setLoading(true);
        void fetchQuestion();
    }

    function handleChange(value: string) {
        setUserAnswer(value);
        onChangeRef.current(question?.token ?? "", value);
    }

    return (
        <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Güvenlik Doğrulaması</Label>
            <div className="flex items-center gap-3 flex-wrap">
                {/* Soru kutusu */}
                <div className="flex items-center gap-2 bg-[#152746]/5 border border-[#152746]/20 rounded-lg px-4 py-2.5 select-none min-w-[9rem] justify-center">
                    {question && !loading ? (
                        <>
                            <span className="text-lg font-bold text-[#152746] tabular-nums">{question.a}</span>
                            <span className="text-lg font-bold text-[#cf9d34]">{question.operator}</span>
                            <span className="text-lg font-bold text-[#152746] tabular-nums">{question.b}</span>
                            <span className="text-lg font-bold text-gray-500">=</span>
                            <span className="text-lg font-bold text-gray-400">?</span>
                        </>
                    ) : (
                        <span className="text-sm text-gray-400">{loadError ? "Soru yüklenemedi" : "Yükleniyor..."}</span>
                    )}
                </div>

                {/* Cevap input */}
                <Input
                    type="number"
                    value={userAnswer}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder="Cevap"
                    disabled={!question || loading}
                    className="w-24 h-11 text-center font-semibold text-lg border-gray-300 bg-white focus:border-[#152746] focus:ring-[#152746]"
                />

                {/* Yenile butonu */}
                <button
                    type="button"
                    onClick={refresh}
                    title="Yeni soru üret"
                    className="p-2 rounded-lg text-gray-400 hover:text-[#152746] hover:bg-[#152746]/5 transition-colors"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>
            <p className="text-xs text-gray-400">
                {loadError
                    ? "Güvenlik sorusu yüklenemedi. Yenile düğmesine basınız."
                    : "Yukarıdaki matematik işleminin sonucunu giriniz."}
            </p>
        </div>
    );
}
