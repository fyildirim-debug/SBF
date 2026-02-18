import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AddAdminForm, AdminCard } from "./AdminComponents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
    const session = await auth();
    const currentUserId = session?.user?.id;

    const admins = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Kullanıcı Yönetimi</h2>
                <p className="text-muted-foreground">Admin kullanıcıları yönetin, şifre değiştirin veya yeni admin ekleyin.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Yeni admin ekleme */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Yeni Admin Ekle</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AddAdminForm />
                    </CardContent>
                </Card>

                {/* Mevcut adminler */}
                <div className="md:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700">Mevcut Adminler ({admins.length})</h3>
                    {admins.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                            Henüz admin kullanıcı yok.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {admins.map((admin) => (
                                <AdminCard key={admin.id} admin={admin} currentUserId={currentUserId} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
