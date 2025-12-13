
import { NextResponse } from 'next/server';
import { getVideos, saveVideos } from '@/lib/data';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    const id = request.url.split('/').slice(-2)[0]; // hacky URL parsing if params not working as expected in some setups, but params.id is standard Next.js
    // Actually params are passed as second arg to route handlers in App Router
    // But let's rely on standard params.

    // Note: params availability depends on folder structure.
    // /api/videos/[id]/view/route.ts -> params.id should be available.

    const videos = getVideos();
    const videoIndex = videos.findIndex(v => v.id === params.id);

    if (videoIndex === -1) {
        return NextResponse.json({ message: 'Video not found' }, { status: 404 });
    }

    videos[videoIndex].viewCount = (videos[videoIndex].viewCount || 0) + 1;
    saveVideos(videos);

    return NextResponse.json({ success: true, viewCount: videos[videoIndex].viewCount });
}
