import { prisma } from "@/lib/prisma";
import { AddFormFieldForm } from "./AddFormFieldForm";
import { FormFieldList } from "./FormFieldList"; // Client component yapacağım interactivity için
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function FormsPage() {
    const fields = await prisma.formField.findMany({
        orderBy: { order: "asc" },
    });

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-[#152746]">Form Düzenleyici</h2>
                <p className="text-gray-500">Öğrenci formuna ek sorular ve bilgi alanları ekleyin.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Yeni Alan Ekle</CardTitle>
                        <CardDescription>Forma yeni bir soru ekleyin.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AddFormFieldForm />
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Mevcut Alanlar</CardTitle>
                        <CardDescription>Aktif form alanlarını yönetin.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormFieldList fields={fields} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
