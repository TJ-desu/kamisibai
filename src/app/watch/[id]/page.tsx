import { prisma } from '@/lib/data';
import { signVideoUrls } from '@/lib/s3';
import { notFound } from 'next/navigation';
import VideoPlayer from '@/app/components/VideoPlayer';
import Link from 'next/link';
import { Video } from '@/types';

export default async function WatchPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    // 1. & 2. Parallel Fetch: Main Video ID & Suggestion Candidates
    const [rawVideo, candidateIds] = await Promise.all([
        prisma.video.findUnique({ where: { id } }),
        prisma.video.findMany({ select: { id: true }, where: { id: { not: id } } })
    ]);

    if (!rawVideo) return notFound();

    // 3. Process Random Suggestions (Fast, in-memory shuffle of IDs)
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

    // Helper to map Prisma result to App Video type
    const mapToVideoType = (v: any): Video => ({
        ...v,
        tags: v.tags,
        uploaderId: v.uploaderId || undefined,
        updatedAt: v.updatedAt.toISOString()
    });

    // 3. Sign URLs for the 3 videos (1 main + 0-2 suggestions)
    const videosToSign = [mapToVideoType(rawVideo), ...suggestionsRaw.map(mapToVideoType)];
    const signedVideos = await signVideoUrls(videosToSign);

    const video = signedVideos[0];
    const suggestedVideos = signedVideos.slice(1);

    if (!video) return notFound();

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '40px', backgroundColor: '#fdfbf7' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
                <Link href="/" style={{ display: 'inline-block', marginBottom: '20px', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 'bold' }}>
                    ← 紙芝居一覧に戻る
                </Link>

                <div style={{
                    backgroundColor: '#000',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-lg)',
                    marginBottom: '20px'
                }}>
                    <VideoPlayer video={video} suggestedVideos={suggestedVideos} />
                </div>

                <div style={{ padding: '0 10px' }}>
                    <h1 style={{ fontSize: '1.8rem', color: 'var(--text-dark)', marginBottom: '10px' }}>{video.title}</h1>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', color: '#666', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {video.tags.map(tag => (
                                <span key={tag} style={{ fontSize: '0.9rem', color: 'var(--primary-color)', backgroundColor: 'var(--bg-soft)', padding: '4px 12px', borderRadius: '20px' }}>
                                    #{tag}
                                </span>
                            ))}
                        </div>
                        <span style={{ fontSize: '0.9rem' }}>{video.viewCount || 0} 回視聴</span>
                    </div>

                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: 'var(--text-dark)' }}>
                        {video.description}
                    </div>
                </div>
            </div>
        </main>
    );
}
