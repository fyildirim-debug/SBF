import { NextRequest, NextResponse } from 'next/server';
import { clientIpFromHeaders } from '@/lib/request-info';

// Kullanıcının IP adresini döndüren API endpoint (onay ekranında gösterilir)
export async function GET(request: NextRequest) {
    return NextResponse.json(
        { ip: clientIpFromHeaders(request.headers) },
        { headers: { 'Cache-Control': 'no-store' } },
    );
}
