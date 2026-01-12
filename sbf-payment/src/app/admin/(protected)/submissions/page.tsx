import { prisma } from "@/lib/prisma";
import { updateSubmissionStatus } from "../../actions";
import { SubmissionDetails } from "./SubmissionDetails";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Check, X, Clock } from "lucide-react";


export const dynamic = 'force-dynamic';

export default async function SubmissionsPage() {
    const submissions = await prisma.submission.findMany({
        orderBy: { createdAt: "desc" },
        include: { facility: true },
    });

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Ödeme Bildirimleri</h2>
                <p className="text-muted-foreground">Öğrencilerden gelen ödeme bildirimlerini inceleyin ve onaylayın.</p>
            </div>

            <Card>
                <CardContent className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase font-medium text-xs">
                                <tr>
                                    <th className="px-6 py-4">Tarih</th>
                                    <th className="px-6 py-4">Öğrenci Bilgileri</th>
                                    <th className="px-6 py-4">Tesis / Tutar</th>
                                    <th className="px-6 py-4">Dekont</th>
                                    <th className="px-6 py-4 text-center">Durum</th>
                                    <th className="px-6 py-4 text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {submissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                            Kaydedilmiş başvuru bulunmuyor.
                                        </td>
                                    </tr>
                                ) : (
                                    submissions.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                                                {new Date(sub.createdAt).toLocaleDateString('tr-TR')}
                                                <br />
                                                <span className="text-xs">{new Date(sub.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold">{sub.fullName}</div>
                                                <div className="text-xs text-muted-foreground">Oğr. No: {sub.studentNo}</div>
                                                <div className="text-xs text-muted-foreground">TC: {sub.tcNo}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium">{sub.facility.name}</div>
                                                <div className="text-xs font-semibold text-primary">{sub.facility.price} TL</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <a
                                                    href={sub.receiptPath}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    <ExternalLink className="w-4 h-4 mr-1" />
                                                    Görüntüle
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <StatusBadge status={sub.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <SubmissionDetails submission={{
                                                        ...sub,
                                                        createdAt: sub.createdAt.toISOString(),
                                                        updatedAt: sub.updatedAt.toISOString()
                                                    }} />
                                                    {sub.status === 'pending' && (
                                                        <>
                                                            <form action={async () => {
                                                                'use server';
                                                                await updateSubmissionStatus(sub.id, 'approved');
                                                            }}>
                                                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700">
                                                                    <Check className="w-4 h-4" />
                                                                </Button>
                                                            </form>
                                                            <form action={async () => {
                                                                'use server';
                                                                await updateSubmissionStatus(sub.id, 'rejected');
                                                            }}>
                                                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            </form>
                                                        </>
                                                    )}
                                                    {sub.status !== 'pending' && (
                                                        <form action={async () => {
                                                            'use server';
                                                            await updateSubmissionStatus(sub.id, 'pending');
                                                        }}>
                                                            <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground">
                                                                Geri Al
                                                            </Button>
                                                        </form>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        pending: "bg-orange-100 text-orange-700 border-orange-200",
        approved: "bg-green-100 text-green-700 border-green-200",
        rejected: "bg-red-100 text-red-700 border-red-200",
    };

    const icons = {
        pending: <Clock className="w-3 h-3 mr-1" />,
        approved: <Check className="w-3 h-3 mr-1" />,
        rejected: <X className="w-3 h-3 mr-1" />,
    };

    const labels = {
        pending: "Bekliyor",
        approved: "Onaylandı",
        rejected: "Reddedildi",
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
            {icons[status as keyof typeof icons]}
            {labels[status as keyof typeof labels] || status}
        </span>
    );
}
