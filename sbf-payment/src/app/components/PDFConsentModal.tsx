"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, CheckCircle2, X, ChevronRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

// Modal arka plan overlay stili
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// Modal içerik animasyonu
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
};

interface PDFDocument {
  name: string;
  title: string;
  path: string;
}

interface ConsentData {
  documentName: string;
  consentAt: string;
  ipAddress: string;
  userAgent: string;
}

interface PDFConsentModalProps {
  isOpen: boolean;
  onComplete: (consents: ConsentData[]) => void;
  onClose: () => void;
  documents: PDFDocument[];
}

export function PDFConsentModal({
  isOpen,
  onComplete,
  onClose,
  documents,
}: PDFConsentModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isChecked, setIsChecked] = useState(false);
  const [consents, setConsents] = useState<ConsentData[]>([]);
  const [ipAddress, setIpAddress] = useState<string>("unknown");
  const [isLoading, setIsLoading] = useState(false);

  const currentDoc = documents[currentStep];
  const isLastStep = currentStep === documents.length - 1;

  // IP adresini al
  useEffect(() => {
    async function fetchIP() {
      try {
        const res = await fetch("/api/get-ip");
        const data = await res.json();
        setIpAddress(data.ip || "unknown");
      } catch {
        setIpAddress("unknown");
      }
    }
    if (isOpen) {
      fetchIP();
    }
  }, [isOpen]);

  // Modal kapandığında sıfırla
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setIsChecked(false);
      setConsents([]);
    }
  }, [isOpen]);

  // Sonraki adıma geç veya tamamla
  const handleNext = async () => {
    if (!isChecked) return;

    setIsLoading(true);

    // Onay kaydı oluştur
    const consent: ConsentData = {
      documentName: currentDoc.name,
      consentAt: new Date().toISOString(),
      ipAddress: ipAddress,
      userAgent: navigator.userAgent,
    };

    const updatedConsents = [...consents, consent];
    setConsents(updatedConsents);

    // Son adımsa tamamla, değilse sonraki adıma geç
    if (isLastStep) {
      onComplete(updatedConsents);
    } else {
      setCurrentStep((prev) => prev + 1);
      setIsChecked(false);
    }

    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {/* Arka plan overlay */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          variants={overlayVariants}
          onClick={onClose}
        />

        {/* Modal içerik */}
        <motion.div
          className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
          variants={modalVariants}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="bg-[#152746] text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6" />
              <div>
                <h2 className="text-lg font-semibold">{currentDoc.title}</h2>
                <p className="text-sm text-white/70">
                  Döküman {currentStep + 1} / {documents.length}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-200">
            <div
              className="h-full bg-[#cf9d34] transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / documents.length) * 100}%`,
              }}
            />
          </div>

          {/* PDF Görüntüleyici */}
          <div className="flex-1 overflow-hidden bg-gray-100">
            <iframe
              src={currentDoc.path}
              className="w-full h-[50vh] border-0"
              title={currentDoc.title}
            />
          </div>

          {/* Footer - Onay bölümü */}
          <div className="border-t border-gray-200 bg-gray-50 p-6 space-y-4">
            {/* Dijital imza bilgisi */}
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-200">
              <Shield className="w-4 h-4 text-[#152746]" />
              <span>
                IP Adresiniz: <strong>{ipAddress}</strong> • Bu onay dijital
                imza olarak kaydedilecektir.
              </span>
            </div>

            {/* Onay checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="peer sr-only"
                />
                <div
                  className={`w-5 h-5 border-2 rounded transition-all ${
                    isChecked
                      ? "bg-[#152746] border-[#152746]"
                      : "bg-white border-gray-300 group-hover:border-[#152746]"
                  }`}
                >
                  {isChecked && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
              </div>
              <span className="text-gray-700 select-none">
                <strong>"{currentDoc.title}"</strong> dökümanını okudum ve kabul
                ediyorum.
              </span>
            </label>

            {/* Butonlar */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-300"
              >
                İptal
              </Button>
              <Button
                onClick={handleNext}
                disabled={!isChecked || isLoading}
                className="bg-[#152746] hover:bg-[#152746]/90 text-white gap-2"
              >
                {isLoading
                  ? "İşleniyor..."
                  : isLastStep
                  ? "Onayla ve Devam Et"
                  : "Sonraki Döküman"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
