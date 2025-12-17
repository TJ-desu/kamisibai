import { prisma } from '@/lib/data';
import { signVideoUrls } from '@/lib/s3';
import { Video } from '@/types';
import VideoPlayer from '@/app/components/VideoPlayer';

// Helper to map Prisma result to App Video type
const mapToVideoType = (v: any): Video => ({
    ...v,
    tags: v.tags,
    uploaderId: v.uploaderId || undefined,
    updatedAt: v.updatedAt.toISOString()
});

export default async function AsyncVideoPlayer({
    videoId,
    initialRawVideo
}: {
    videoId: string,
    initialRawVideo: any
}) {
    // 1. Fetch Suggestions (Parallel)
    const candidateIds = await prisma.video.findMany({
        select: { id: true },
        where: { id: { not: videoId } }
    });

    let suggestionsRaw: any[] = [];
    if (candidateIds.length > 0) {
        // Shuffle IDs and pick 2
        const shuffled = candidateIds.sort(() => 0.5 - Math.random());
        const selectedIds = shuffled.slice(0, 2).map(c => c.id);

        // Fetch full data for these 2 IDs only
        suggestionsRaw = await prisma.video.findMany({
            where: { id: { in: selectedIds } }
        });
    }

    // 2. Sign URLs (This is the slow part we want to suspend)
    const videosToSign = [mapToVideoType(initialRawVideo), ...suggestionsRaw.map(mapToVideoType)];
    const signedVideos = await signVideoUrls(videosToSign);

    const video = signedVideos[0];
    const suggestedVideos = signedVideos.slice(1);

    if (!video) return <div>Video not found</div>;

    return <VideoPlayer video={video} suggestedVideos={suggestedVideos} />;
}
