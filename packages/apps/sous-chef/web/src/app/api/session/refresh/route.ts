import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function POST(request: NextRequest) {
    const session = await auth0.getSession(request);

    if (!session) {
        return NextResponse.json({ status: 'no_session' }, { status: 401 });
    }

    const mutableResponse = NextResponse.json({ status: 'ok' });

    try {
        const token = await auth0.getAccessToken(request, mutableResponse);
        return NextResponse.json({ status: 'ok', expiresAt: token.expiresAt }, { headers: mutableResponse.headers });
    } catch {
        return NextResponse.json({ status: 'expired' }, { status: 401 });
    }
}
