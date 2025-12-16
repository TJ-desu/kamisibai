
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Removed runtime = 'edge'

export async function POST() {
    (await cookies()).delete('auth_token');
    return NextResponse.json({ success: true });
}
