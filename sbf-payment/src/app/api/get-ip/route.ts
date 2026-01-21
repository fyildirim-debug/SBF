import { NextRequest, NextResponse } from 'next/server';

// Kullanıcının IP adresini döndüren API endpoint
export async function GET(request: NextRequest) {
    // Next.js headers'dan IP adresi al
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');

    // X-Forwarded-For header'ı virgülle ayrılmış birden fazla IP içerebilir
    // İlk IP gerçek client IP'sidir
    let ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

    // Localhost durumunda
    if (ip === '::1' || ip === '127.0.0.1') {
        ip = 'localhost';
    }

    return NextResponse.json({ ip });
}
