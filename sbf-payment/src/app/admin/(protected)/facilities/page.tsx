import { prisma } from "@/lib/prisma";
import { AddFacilityForm } from "./AddFacilityForm";
import { FacilityCard } from "./FacilityCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default async function FacilitiesPage() {
    const facilities = await prisma.facility.findMany({
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Tesis Yönetimi</h2>
                <p className="text-muted-foreground">Tesisleri ekleyin, düzenleyin veya kaldırın.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Yeni tesis ekleme */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Yeni Tesis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AddFacilityForm />
                    </CardContent>
                </Card>

                {/* Mevcut tesisler */}
                <div className="md:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700">Mevcut Tesisler ({facilities.length})</h3>
                    {facilities.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                            Henüz tesis eklenmemiş.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {facilities.map((facility) => (
                                <FacilityCard key={facility.id} facility={facility} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
