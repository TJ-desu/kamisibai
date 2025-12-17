import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/data';

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;

    try {
        const video = await prisma.video.update({
            where: { id },
            data: {
                viewCount: {
                    increment: 1
                }
            }
        });

        return NextResponse.json({ success: true, viewCount: video.viewCount });
    } catch (error) {
        console.error('Failed to increment view count:', error);
        return NextResponse.json({ message: 'Video not found or database error' }, { status: 404 });
    }
}
