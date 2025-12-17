import { prisma } from '@/lib/data';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import AsyncVideoPlayer from './AsyncVideoPlayer';
import VideoMetadata from './VideoMetadata';

export default async function WatchPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;

    // 1. Fetch ONLY Main Video Metadata (Fastest possible query)
    const rawVideo = await prisma.video.findUnique({
        where: { id }
    });

    if (!rawVideo) return notFound();

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
                    marginBottom: '20px',
                    aspectRatio: '16 / 9',
                    width: '100%',
                    position: 'relative'
                }}>
                    <Suspense fallback={
                        <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff'
                        }}>
                            <div className="spinner"></div>
                            {/* Re-using spinner from loading.tsx via global css or inline if needed. 
                                 For now, assume simple text or inline spinner style */}
                            <style>{`
                                .spinner {
                                    width: 50px;
                                    height: 50px;
                                    border: 5px solid rgba(255, 255, 255, 0.3);
                                    border-radius: 50%;
                                    border-top-color: #fff;
                                    animation: spin 1s ease-in-out infinite;
                                }
                                @keyframes spin { to { transform: rotate(360deg); } }
                            `}</style>
                        </div>
                    }>
                        <AsyncVideoPlayer videoId={id} initialRawVideo={rawVideo} />
                    </Suspense>
                </div>

                {/* Client Side Metadata Rendering for Instant Transition */}
                <VideoMetadata serverVideo={{
                    ...rawVideo,
                    tags: rawVideo.tags,
                    uploaderId: rawVideo.uploaderId || undefined,
                    updatedAt: rawVideo.updatedAt.toISOString(),
                    // Ensure required fields are present
                    thumbnail: rawVideo.thumbnail || undefined
                }} />
            </div>
        </main>
    );
}
