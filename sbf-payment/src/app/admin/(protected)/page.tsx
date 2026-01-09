import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck, Clock, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
    const [totalSubmissions, pendingSubmissions, approvedSubmissions, rejectedSubmissions] = await Promise.all([
        prisma.submission.count(),
        prisma.submission.count({ where: { status: "pending" } }),
        prisma.submission.count({ where: { status: "approved" } }),
        prisma.submission.count({ where: { status: "rejected" } }),
    ]);

    const recentSubmissions = await prisma.submission.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { facility: true },
    });

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">Genel Bakış</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Toplam Başvuru"
                    value={totalSubmissions}
                    icon={<FileCheck className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard
                    title="Bekleyen Onay"
                    value={pendingSubmissions}
                    icon={<Clock className="h-4 w-4 text-orange-500" />}
                />
                <StatCard
                    title="Onaylanan"
                    value={approvedSubmissions}
                    icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
                />
                <StatCard
                    title="Reddedilen"
                    value={rejectedSubmissions}
                    icon={<XCircle className="h-4 w-4 text-red-500" />}
                />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-[#152746]">Son Başvurular</h3>
                    <Link
                        href="/admin/submissions"
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-[#152746]/20 shadow-sm h-8 px-3 text-xs bg-white hover:bg-gray-50 text-[#152746]"
                    >
                        Tümünü Gör
                    </Link>
                </div>

                <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 align-middle font-semibold text-[#152746]">Öğrenci</th>
                                    <th className="h-12 px-4 align-middle font-semibold text-[#152746]">Tesis</th>
                                    <th className="h-12 px-4 align-middle font-semibold text-[#152746]">Tutar</th>
                                    <th className="h-12 px-4 align-middle font-semibold text-[#152746]">Durum</th>
                                    <th className="h-12 px-4 align-middle font-semibold text-[#152746]">Tarih</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0 bg-white">
                                {recentSubmissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-400">Henüz başvuru bulunmuyor.</td>
                                    </tr>
                                ) : (
                                    recentSubmissions.map((sub) => (
                                        <tr key={sub.id} className="border-b border-gray-100 transition-colors hover:bg-blue-50/50">
                                            <td className="p-4 align-middle">
                                                <div className="font-medium text-gray-900">{sub.fullName}</div>
                                                <div className="text-xs text-gray-500">{sub.studentNo}</div>
                                            </td>
                                            <td className="p-4 align-middle text-gray-700">{sub.facility.name}</td>
                                            <td className="p-4 align-middle text-gray-700">{sub.facility.price} TL</td>
                                            <td className="p-4 align-middle">
                                                <StatusBadge status={sub.status} />
                                            </td>
                                            <td className="p-4 align-middle text-gray-500">
                                                {new Date(sub.createdAt).toLocaleDateString('tr-TR')}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
    return (
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-[#152746]">{value}</div>
            </CardContent>
        </Card>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        pending: "bg-orange-100 text-orange-700 border border-orange-200",
        approved: "bg-green-100 text-green-700 border border-green-200",
        rejected: "bg-red-100 text-red-700 border border-red-200",
    };

    const labels = {
        pending: "Bekliyor",
        approved: "Onaylandı",
        rejected: "Reddedildi",
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
            {labels[status as keyof typeof labels] || status}
        </span>
    );
}
