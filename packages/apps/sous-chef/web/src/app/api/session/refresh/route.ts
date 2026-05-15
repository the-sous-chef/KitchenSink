import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function POST(request: NextRequest) {
    const response = NextResponse.json({ refreshed: true });

    try {
        const token = await auth0.getAccessToken(request, response);

        return NextResponse.json({ refreshed: true, expiresAt: token.expiresAt }, { headers: response.headers });
    } catch {
        return NextResponse.json({ refreshed: false }, { status: 401 });
    }
}
