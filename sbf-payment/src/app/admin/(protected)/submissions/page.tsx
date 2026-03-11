import { prisma } from "@/lib/prisma";
import { SubmissionsClient } from "./SubmissionsClient";

export const dynamic = 'force-dynamic';

export default async function SubmissionsPage() {
    const submissions = await prisma.submission.findMany({
        orderBy: { createdAt: "desc" },
        include: { facility: true, consents: true },
    });

    const serialized = submissions.map((sub) => ({
        ...sub,
        facility: {
            ...sub.facility,
            createdAt: sub.facility.createdAt.toISOString() as unknown as Date,
        },
        consents: sub.consents?.map((c) => ({
            ...c,
            consentAt: c.consentAt.toISOString(),
        })),
        createdAt: sub.createdAt.toISOString(),
        updatedAt: sub.updatedAt.toISOString(),
    }));

    return <SubmissionsClient submissions={serialized as Parameters<typeof SubmissionsClient>[0]['submissions']} />;
}
