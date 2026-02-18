import { getAllConsentDocuments } from "@/app/actions/documents";
import { DocumentsManager } from "./DocumentsManager";
import { FileText } from "lucide-react";

export default async function DocumentsPage() {
    const docs = await getAllConsentDocuments();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#152746]/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#152746]" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-[#152746]">Onay Dökümanları</h1>
                    <p className="text-sm text-gray-500">Başvuru formunda onaylatılan PDF dökümanlarını yönetin</p>
                </div>
            </div>

            <DocumentsManager initialDocs={docs} />
        </div>
    );
}
