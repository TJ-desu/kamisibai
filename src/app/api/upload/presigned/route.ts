import { NextResponse } from 'next/server';
import { getPresignedUploadUrl } from '@/lib/s3';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const token = (await cookies()).get('auth_token');
        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { filename, contentType } = await request.json();

        if (!filename || !contentType) {
            return NextResponse.json({ message: 'Filename and Content-Type are required' }, { status: 400 });
        }

        // Sanitize filename (basic)
        const ext = filename.split('.').pop();
        const randomId = crypto.randomUUID();
        const safeKey = `videos/${randomId}.${ext}`;

        const url = await getPresignedUploadUrl(safeKey, contentType);

        if (!url) {
            return NextResponse.json({ message: 'Failed to generate presigned URL (Check AWS Config)' }, { status: 500 });
        }

        const accessUrl = url.split("?")[0];
        return NextResponse.json({ url, key: safeKey, accessUrl });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
