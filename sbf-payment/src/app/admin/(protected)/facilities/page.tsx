import { prisma } from "@/lib/prisma";
import { AddFacilityForm } from "./AddFacilityForm";
import { DeleteFacilityButton } from "./DeleteFacilityButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function FacilitiesPage() {
    const facilities = await prisma.facility.findMany({
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#152746]">Tesis Yönetimi</h2>
                    <p className="text-gray-500">Öğrencilerin seçebileceği tesisleri ve ücretlerini buradan yönetebilirsiniz.</p>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Tesis Ekleme Formu */}
                <Card>
                    <CardHeader>
                        <CardTitle>Yeni Tesis Ekle</CardTitle>
                        <CardDescription>Listeye yeni bir spor tesisi veya hizmet ekleyin.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AddFacilityForm />
                    </CardContent>
                </Card>

                {/* Mevcut Tesisler Listesi */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold px-1">Mevcut Tesisler ({facilities.length})</h3>
                    {facilities.length === 0 ? (
                        <div className="text-muted-foreground p-4 border rounded-md bg-muted/20 text-center">
                            Henüz eklenmiş bir tesis yok.
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {facilities.map((facility) => (
                                <Card key={facility.id} className="overflow-hidden">
                                    <div className="flex items-center justify-between p-6">
                                        <div>
                                            <h4 className="font-semibold text-lg">{facility.name}</h4>
                                            <p className="text-sm text-muted-foreground">{facility.description}</p>
                                            <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                {facility.price} TL
                                            </div>
                                        </div>
                                        <DeleteFacilityButton id={facility.id} />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
