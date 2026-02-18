"use client";

import { useState, useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Operator = "+" | "-" | "×";

interface CaptchaQuestion {
    a: number;
    b: number;
    operator: Operator;
    answer: number;
    token: string;
}

interface MathCaptchaProps {
    onValidChange: (isValid: boolean, token: string, userAnswer: string) => void;
}

function generateToken(answer: number): string {
    const salt = "sbf-ankara-2024";
    const timestamp = Math.floor(Date.now() / 60000);
    const raw = `${answer}:${timestamp}:${salt}`;
    return btoa(raw);
}

function generateQuestion(): CaptchaQuestion {
    const operators: Operator[] = ["+", "-", "×"];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    let a: number, b: number, answer: number;

    switch (operator) {
        case "+":
            a = Math.floor(Math.random() * 20) + 1;
            b = Math.floor(Math.random() * 20) + 1;
            answer = a + b;
            break;
        case "-":
            a = Math.floor(Math.random() * 20) + 10;
            b = Math.floor(Math.random() * a) + 1;
            answer = a - b;
            break;
        case "×":
            a = Math.floor(Math.random() * 9) + 2;
            b = Math.floor(Math.random() * 9) + 2;
            answer = a * b;
            break;
        default:
            a = 5; b = 3; answer = 8;
    }

    return { a, b, operator, answer, token: generateToken(answer) };
}

export function MathCaptcha({ onValidChange }: MathCaptchaProps) {
    // Soruyu ref ile tut — state değişimlerinden etkilenmesin
    const questionRef = useRef<CaptchaQuestion>(generateQuestion());
    const [question, setQuestion] = useState<CaptchaQuestion>(questionRef.current);
    const [userAnswer, setUserAnswer] = useState("");
    // null = henüz kontrol edilmedi, true = doğru, false = yanlış
    const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // onValidChange'i ref'te tut — dependency array sorununu önler
    const onValidChangeRef = useRef(onValidChange);
    onValidChangeRef.current = onValidChange;

    // Sadece ilk mount'ta çalışır
    useEffect(() => {
        onValidChangeRef.current(false, question.token, "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function newQuestion() {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const q = generateQuestion();
        questionRef.current = q;
        setQuestion(q);
        setUserAnswer("");
        setStatus("idle");
        onValidChangeRef.current(false, q.token, "");
    }

    function checkAnswer(value: string, q: CaptchaQuestion) {
        if (value === "" || value === "-") {
            setStatus("idle");
            onValidChangeRef.current(false, q.token, value);
            return;
        }
        const parsed = parseInt(value, 10);
        if (isNaN(parsed)) {
            setStatus("idle");
            onValidChangeRef.current(false, q.token, value);
            return;
        }
        const correct = parsed === q.answer;
        setStatus(correct ? "correct" : "wrong");
        onValidChangeRef.current(correct, q.token, value);
    }

    function handleChange(value: string) {
        setUserAnswer(value);
        // Yazarken durumu sıfırla (ne doğru ne yanlış göster)
        setStatus("idle");
        onValidChangeRef.current(false, questionRef.current.token, value);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (value === "" || value === "-") return;

        // 700ms sonra kontrol et
        debounceRef.current = setTimeout(() => {
            checkAnswer(value, questionRef.current);
        }, 700);
    }

    function handleBlur() {
        // Input'tan çıkınca debounce'u beklemeden anında kontrol et
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (userAnswer !== "") {
            checkAnswer(userAnswer, questionRef.current);
        }
    }

    const inputClass = `w-24 h-11 text-center font-semibold text-lg transition-colors
        ${status === "correct"
            ? "border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-500"
            : status === "wrong"
                ? "border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-400"
                : "border-gray-300 bg-white focus:border-[#152746] focus:ring-[#152746]"
        }`;

    return (
        <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Güvenlik Doğrulaması</Label>
            <div className="flex items-center gap-3 flex-wrap">
                {/* Soru kutusu */}
                <div className="flex items-center gap-2 bg-[#152746]/5 border border-[#152746]/20 rounded-lg px-4 py-2.5 select-none">
                    <span className="text-lg font-bold text-[#152746] tabular-nums">{question.a}</span>
                    <span className="text-lg font-bold text-[#cf9d34]">{question.operator}</span>
                    <span className="text-lg font-bold text-[#152746] tabular-nums">{question.b}</span>
                    <span className="text-lg font-bold text-gray-500">=</span>
                    <span className="text-lg font-bold text-gray-400">?</span>
                </div>

                {/* Cevap input */}
                <Input
                    type="number"
                    value={userAnswer}
                    onChange={(e) => handleChange(e.target.value)}
                    onBlur={handleBlur}
                    placeholder="Cevap"
                    className={inputClass}
                />

                {/* Yenile butonu */}
                <button
                    type="button"
                    onClick={newQuestion}
                    title="Yeni soru üret"
                    className="p-2 rounded-lg text-gray-400 hover:text-[#152746] hover:bg-[#152746]/5 transition-colors"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>

                {/* Durum mesajı */}
                {status === "correct" && (
                    <span className="text-green-600 font-semibold text-sm">✓ Doğru</span>
                )}
                {status === "wrong" && (
                    <span className="text-red-500 font-semibold text-sm">✗ Yanlış</span>
                )}
            </div>
            <p className="text-xs text-gray-400">
                Yukarıdaki matematik işleminin sonucunu giriniz.
            </p>
        </div>
    );
}
